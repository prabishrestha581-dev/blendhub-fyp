import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import OrderStatusButtons from "./order-status-buttons";

type Props = {
  params: Promise<{ cafeId: string }>;
};

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  total: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  item_name: string;
  unit_price: string;
  quantity: number;
};

export default function OrdersPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="p-6">Loading orders...</p>}>
      <OrdersContent params={params} />
    </Suspense>
  );
}

async function OrdersContent({ params }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/auth/login");

  const { cafeId } = await params;

  const cafeResult = await db.query<{ name: string }>(
    `SELECT cafe.name
     FROM cafe
     JOIN cafe_member ON cafe_member.cafe_id = cafe.id
     WHERE cafe.id::text = $1 AND cafe_member.user_id = $2`,
    [cafeId, session.user.id],
  );

  const cafe = cafeResult.rows[0];
  if (!cafe) notFound();

  const ordersResult = await db.query<Order>(
    `SELECT orders.id, orders.customer_name, orders.customer_phone,
            orders.status, orders.total
     FROM cafe_order AS orders
     JOIN cafe_member AS member ON member.cafe_id = orders.cafe_id
     WHERE orders.cafe_id::text = $1 AND member.user_id = $2
     ORDER BY orders.created_at DESC, orders.id DESC
     LIMIT 50`,
    [cafeId, session.user.id],
  );

  const orderIds = ordersResult.rows.map((order) => order.id);

  const itemsResult = await db.query<OrderItem>(
    `SELECT item.id, item.order_id, item.item_name,
            item.unit_price, item.quantity
     FROM order_item AS item
     JOIN cafe_order AS orders ON orders.id = item.order_id
     JOIN cafe_member AS member ON member.cafe_id = orders.cafe_id
     WHERE item.order_id = ANY($1::uuid[])
       AND orders.cafe_id::text = $2
       AND member.user_id = $3
     ORDER BY item.id`,
    [orderIds, cafeId, session.user.id],
  );

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link
        href={`/dashboard/cafe/${cafeId}`}
        className="text-sm text-blue-700 hover:underline"
      >
        Back to café
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Orders — {cafe.name}</h1>
      <p className="mt-2 text-sm text-gray-600">
        Latest 50 orders. Refresh the page to check for new orders.
      </p>

      {ordersResult.rows.length === 0 ? (
        <p className="mt-6">No orders yet.</p>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {ordersResult.rows.map((order) => (
            <article key={order.id} className="rounded-xl border p-5">
              <p className="break-all text-xs text-gray-500">
                Reference: {order.id}
              </p>

              <h2 className="mt-3 text-lg font-semibold">
                {order.customer_name}
              </h2>
              <p className="text-sm">{order.customer_phone}</p>

              <p className="mt-3 font-medium capitalize">
                Status: {order.status}
              </p>

              <ul className="mt-4 space-y-2 border-t pt-4">
                {itemsResult.rows
                  .filter((item) => item.order_id === order.id)
                  .map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <span>
                        {item.quantity} × {item.item_name}
                      </span>
                      <span className="whitespace-nowrap">
                        NPR{" "}
                        {(Number(item.unit_price) * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
              </ul>

              <p className="mt-4 border-t pt-3 font-semibold">
                Total: NPR {Number(order.total).toFixed(2)}
              </p>

              <OrderStatusButtons
                cafeId={cafeId}
                orderId={order.id}
                status={order.status}
              />
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
