"use server";

import type { PoolClient } from "pg";
import { db } from "@/lib/db";
import { validateCustomerDetails } from "@/lib/customer-validation";

type OrderInput = {
  cafeId: string;
  requestId: string;
  customerName: string;
  customerPhone: string;
  items: { id: string; quantity: number }[];
};

type OrderResult =
  | {
      error: string;
      retryable?: boolean;
      orderId?: never;
      total?: never;
    }
  | { error?: never; orderId: string; total: string };
class OrderError extends Error {}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function placeOrder(input: OrderInput): Promise<OrderResult> {
  // TypeScript types do not validate incoming browser requests.
  if (
    !input ||
    typeof input.cafeId !== "string" ||
    typeof input.requestId !== "string" ||
    !uuidPattern.test(input.cafeId) ||
    !uuidPattern.test(input.requestId)
  ) {
    return { error: "Invalid order request. Refresh and try again." };
  }

  if (
    typeof input.customerName !== "string" ||
    typeof input.customerPhone !== "string"
  ) {
    return { error: "Enter your name and phone number." };
  }

  const customer = validateCustomerDetails(
    input.customerName,
    input.customerPhone,
  );

  if (customer.error) {
    return { error: customer.error };
  }

  const { name, phone } = customer;

  if (
    !Array.isArray(input.items) ||
    input.items.length === 0 ||
    input.items.length > 50
  ) {
    return { error: "Choose between 1 and 50 different menu items." };
  }

  const quantities = new Map<string, number>();

  for (const item of input.items) {
    if (
      !item ||
      typeof item.id !== "string" ||
      !uuidPattern.test(item.id) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    ) {
      return { error: "Invalid item or quantity." };
    }

    const id = item.id.toLowerCase();

    if (quantities.has(id)) {
      return { error: "The cart contains a duplicate item." };
    }

    quantities.set(id, item.quantity);
  }

  let client: PoolClient | undefined;
  let discardConnection = false;

  try {
    client = await db.connect();
    await client.query("BEGIN");

    // Claim this request ID. The unique constraint prevents duplicates.
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO cafe_order
         (cafe_id, request_id, customer_name, customer_phone, total)
       VALUES ($1, $2, $3, $4, 0)
       ON CONFLICT (cafe_id, request_id) DO NOTHING
       RETURNING id`,
      [input.cafeId, input.requestId, name, phone],
    );

    // A retry of an already saved order returns the original result.
    if (inserted.rows.length === 0) {
      const previous = await client.query<{ id: string; total: string }>(
        `SELECT id, total FROM cafe_order
         WHERE cafe_id = $1 AND request_id = $2`,
        [input.cafeId, input.requestId],
      );

      if (!previous.rows[0]) {
        throw new OrderError("Could not find the previous order.");
      }

      await client.query("COMMIT");

      return {
        orderId: previous.rows[0].id,
        total: previous.rows[0].total,
      };
    }

    const orderId = inserted.rows[0].id;

    // Read current prices and lock these items until the order is saved.
    const menu = await client.query<{
      id: string;
      name: string;
      price: string;
      is_available: boolean;
    }>(
      `SELECT id, name, price, is_available
       FROM menu_item
       WHERE cafe_id = $1 AND id = ANY($2::uuid[])
       ORDER BY id
       FOR SHARE`,
      [input.cafeId, [...quantities.keys()]],
    );

    if (menu.rows.length !== quantities.size) {
      throw new OrderError(
        "Some items are no longer on this café's menu. Refresh your menu.",
      );
    }

    let totalPaisa = 0;

    for (const item of menu.rows) {
      if (!item.is_available) {
        throw new OrderError(
          `${item.name} is currently unavailable. Remove it from your cart.`,
        );
      }

      const quantity = quantities.get(item.id)!;

      // Convert the database decimal string to whole paisa.
      const [rupees, paisa = ""] = item.price.split(".");
      const unitPaisa =
        Number(rupees) * 100 + Number(paisa.padEnd(2, "0"));

      totalPaisa += unitPaisa * quantity;

      await client.query(
        `INSERT INTO order_item
           (order_id, menu_item_id, item_name, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.id, item.name, item.price, quantity],
      );
    }

    const total = (totalPaisa / 100).toFixed(2);

    await client.query(
      `UPDATE cafe_order SET total = $1 WHERE id = $2`,
      [total, orderId],
    );

    await client.query("COMMIT");

    return { orderId, total };
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch {
        discardConnection = true;
      }
    }

    return {
      error:
        error instanceof OrderError
          ? error.message
          : "Could not confirm the order. Retry using the same request.",
      retryable: !(error instanceof OrderError),
    };
  } finally {
    client?.release(discardConnection);
  }
}
