import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import RefreshOrderButton from "./refresh-order-button";

export const metadata: Metadata = {
  title: "Track your order | BlendHub",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const statusMessages: Record<string, string> = {
  pending: "Your order is waiting for the café to accept it.",
  accepted: "The café has accepted your order.",
  preparing: "Your order is being prepared.",
  ready: "Your order is ready! Please collect it at the café.",
  completed: "Your order has been collected. Thank you!",
  cancelled: "This order has been cancelled.",
};

export default function TrackingPage(props: Props) {
  return (
    <Suspense fallback={<p className="p-6">Loading your order...</p>}>
      <TrackingContent {...props} />
    </Suspense>
  );
}

async function TrackingContent({ params, searchParams }: Props) {
  await connection();

  const { orderId } = await params;
  const { token } = await searchParams;

  if (
    !uuidPattern.test(orderId) ||
    typeof token !== "string" ||
    !uuidPattern.test(token)
  ) {
    notFound();
  }

  const result = await db.query<{
    id: string;
    cafe_id: string;
    cafe_name: string;
    status: string;
    total: string;
  }>(
    `SELECT orders.id, orders.cafe_id, cafe.name AS cafe_name,
            orders.status, orders.total
     FROM cafe_order AS orders
     JOIN cafe ON cafe.id = orders.cafe_id
     WHERE orders.id = $1 AND orders.tracking_token = $2`,
    [orderId, token],
  );

  const order = result.rows[0];
  if (!order) notFound();

  const itemsResult = await db.query<{
    id: string;
    item_name: string;
    unit_price: string;
    quantity: number;
  }>(
    `SELECT item.id, item.item_name, item.unit_price, item.quantity
     FROM order_item AS item
     JOIN cafe_order AS orders ON orders.id = item.order_id
     WHERE orders.id = $1 AND orders.tracking_token = $2
     ORDER BY item.id`,
    [orderId, token],
  );

  return (
    <main className="min-h-screen bg-[#faf6ee] px-6 py-10 text-[#2b1709]">
      <div className="mx-auto max-w-xl rounded-xl border border-[#2b1709]/15 bg-white p-6">
        <p className="text-sm text-[#a85520]">{order.cafe_name}</p>
        <h1 className="mt-2 text-2xl font-bold">Track your order</h1>
        <p className="mt-3 break-all text-xs text-gray-500">
          Reference: {order.id}
        </p>

        <section className="mt-6 rounded-lg bg-[#faf6ee] p-4">
          <h2 className="font-semibold capitalize">{order.status}</h2>
          <p className="mt-2 text-sm">{statusMessages[order.status]}</p>
        </section>

        <h2 className="mt-6 font-semibold">Your items</h2>

        <ul className="mt-3 space-y-3">
          {itemsResult.rows.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 text-sm">
              <span>
                {item.quantity} × {item.item_name}
              </span>
              <span className="whitespace-nowrap">
                NPR {(Number(item.unit_price) * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-5 border-t pt-4 font-semibold">
          Total: NPR {Number(order.total).toFixed(2)}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Pickup order · Payment at the café
        </p>

        <RefreshOrderButton />

        <p className="mt-4 text-sm text-gray-600">
          Bookmark this private link to check your order later.
        </p>

        <Link
          href={`/menu/${order.cafe_id}`}
          className="mt-4 inline-block text-sm text-[#a85520] hover:underline"
        >
          Back to menu
        </Link>
      </div>
    </main>
  );
}