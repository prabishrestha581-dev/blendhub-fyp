import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
    [cafeId, session.user.id]
  );

  const cafe = rows[0];
  if (!cafe) notFound();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">
        Back to dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">{cafe.name}</h1>
      <p className="mt-2 text-sm text-gray-600">Your role: {cafe.role}</p>
    </main>
  );
}