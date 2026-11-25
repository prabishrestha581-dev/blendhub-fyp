import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import KitchenOrderButtons from "./kitchen-order-buttons";

type Props = {
  params: Promise<{ cafeId: string }>;
};

type KitchenOrder = {
  id: string;
  status: string;
};

type KitchenItem = {
  id: string;
  order_id: string;
  item_name: string;
  quantity: number;
};

export default function KitchenPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="p-6">Loading kitchen orders...</p>}>
      <KitchenContent params={params} />
    </Suspense>
  );
}

async function KitchenContent({ params }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/auth/login");

  const { cafeId } = await params;

  const cafeResult = await db.query<{ name: string }>(
    `SELECT cafe.name
     FROM cafe
     JOIN cafe_member AS member ON member.cafe_id = cafe.id
     WHERE cafe.id::text = $1
       AND member.user_id = $2
       AND member.role IN ('owner', 'staff')`,
    [cafeId, session.user.id],
  );

  const cafe = cafeResult.rows[0];
  if (!cafe) notFound();

  const ordersResult = await db.query<KitchenOrder>(
    `SELECT orders.id, orders.status
     FROM cafe_order AS orders
     JOIN cafe_member AS member ON member.cafe_id = orders.cafe_id
     WHERE orders.cafe_id::text = $1
       AND member.user_id = $2
       AND member.role IN ('owner', 'staff')
       AND orders.status IN ('accepted', 'preparing')
     ORDER BY orders.created_at ASC, orders.id ASC
     LIMIT 50`,
    [cafeId, session.user.id],
  );

  const orderIds = ordersResult.rows.map((order) => order.id);

  const itemsResult = await db.query<KitchenItem>(
    `SELECT item.id, item.order_id, item.item_name, item.quantity
     FROM order_item AS item
     JOIN cafe_order AS orders ON orders.id = item.order_id
     JOIN cafe_member AS member ON member.cafe_id = orders.cafe_id
     WHERE item.order_id = ANY($1::uuid[])
       AND orders.cafe_id::text = $2
       AND member.user_id = $3
       AND member.role IN ('owner', 'staff')
     ORDER BY item.id`,
    [orderIds, cafeId, session.user.id],
  );

  return (
    <main className="min-h-screen bg-[#faf6ee] p-6 text-[#2b1709]">
      <div className="mx-auto max-w-7xl">
        <Link
          href={`/dashboard/cafe/${cafeId}`}
          className="text-sm text-blue-700 hover:underline"
        >
          Back to café
        </Link>

        <h1 className="mt-4 text-3xl font-bold">
          Kitchen — {cafe.name}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Oldest 50 active orders first. Refresh your browser for new orders.
        </p>

        {ordersResult.rows.length === 0 ? (
          <p className="mt-8 rounded-xl border bg-white p-6">
            No orders waiting for preparation.
          </p>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {ordersResult.rows.map((order) => (
              <article
                key={order.id}
                className={`rounded-xl border-2 bg-white p-5 ${
                  order.status === "preparing"
                    ? "border-orange-400"
                    : "border-blue-300"
                }`}
              >
                <h2 className="text-lg font-semibold">
                  Order {order.id.slice(0, 8)}
                </h2>
                <p className="mt-1 break-all text-xs text-gray-500">
                  Full reference: {order.id}
                </p>

                <p className="mt-3 font-semibold capitalize">
                  {order.status}
                </p>

                <ul className="mt-4 space-y-4 border-t pt-4">
                  {itemsResult.rows
                    .filter((item) => item.order_id === order.id)
                    .map((item) => (
                      <li key={item.id} className="flex items-start gap-3">
                        <span className="rounded-md bg-[#f0e8dc] px-3 py-1 text-2xl font-bold">
                          {item.quantity}×
                        </span>
                        <span className="pt-1 text-lg font-medium">
                          {item.item_name}
                        </span>
                      </li>
                    ))}
                </ul>

                <KitchenOrderButtons
                  cafeId={cafeId}
                  orderId={order.id}
                  status={order.status}
                />
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}