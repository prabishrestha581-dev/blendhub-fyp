import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import MenuItemForm from "./menu-item-form";

type Props = { params: Promise<{ cafeId: string }> };

export default function CafePage({ params }: Props) {
  return (
    <Suspense fallback={<p>Loading café...</p>}>
      <CafeContent params={params} />
    </Suspense>
  );
}

async function CafeContent({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/login");

  const { cafeId } = await params;
  const { rows } = await db.query<{ name: string; role: string }>(
    `SELECT cafe.name, cafe_member.role
     FROM cafe
     JOIN cafe_member ON cafe_member.cafe_id = cafe.id
     WHERE cafe.id::text = $1 AND cafe_member.user_id = $2`,
    [cafeId, session.user.id],
  );

  const cafe = rows[0];
  if (!cafe) notFound();

  const menuResult = await db.query<{
    id: string;
    name: string;
    category: string;
    price: string;
    is_available: boolean;
    image_url: string | null;
  }>(
    `SELECT id, name, category, price, is_available, image_url
   FROM menu_item
   WHERE cafe_id::text = $1
   ORDER BY created_at, id`,
    [cafeId],
  );

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">
        Back to dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">{cafe.name}</h1>
      <p className="mt-2 text-sm text-gray-600">Your role: {cafe.role}</p>
      {cafe.role === "owner" && <MenuItemForm cafeId={cafeId} />}

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Your menu</h2>

        {menuResult.rows.length === 0 ? (
          <p className="mt-3 text-gray-600">No menu items added yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {menuResult.rows.map((item) => (
              <article key={item.id} className="rounded-xl border p-4">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    width={600}
                    height={400}
                    className="mb-3 h-44 w-full rounded-lg object-cover"
                    loading="lazy"
                  />
                )}
                <h3 className="font-semibold">{item.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{item.category}</p>
                <p className="mt-2">NPR {Number(item.price).toFixed(2)}</p>
                <p className="mt-2 text-sm">
                  {item.is_available ? "Available" : "Unavailable"}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
