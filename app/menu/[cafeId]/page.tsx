import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import MenuWithCart from "./menu-with-cart";

type Props = {
  params: Promise<{ cafeId: string }>;
};

export default function PublicMenuPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="p-6">Loading menu...</p>}>
      <PublicMenuContent params={params} />
    </Suspense>
  );
}

async function PublicMenuContent({ params }: Props) {
  const { cafeId } = await params;

  const cafeResult = await db.query<{ name: string }>(
    `SELECT name FROM cafe WHERE id::text = $1`,
    [cafeId],
  );

  const cafe = cafeResult.rows[0];
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
     ORDER BY category, name, id`,
    [cafeId],
  );

  return (
    <main className="min-h-screen bg-[#faf6ee] text-[#2b1709]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="border-b border-[#2b1709]/15 pb-6">
          <p className="text-sm font-medium text-[#a85520]">BlendHub</p>
          <h1 className="mt-2 text-3xl font-bold">{cafe.name}</h1>
          <p className="mt-2 text-[#2b1709]/70">Explore our food and drinks.</p>
        </header>

        <MenuWithCart key={cafeId} cafeId={cafeId} items={menuResult.rows} />
      </div>
    </main>
  );
}
