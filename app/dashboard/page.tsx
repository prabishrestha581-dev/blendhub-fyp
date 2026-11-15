import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LogoutButton from "./logout-button";
import { db } from "@/lib/db";
import Link from "next/link";
import LinkGoogleButton from "./link-google-button";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p>Loading dashboard...</p>}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  const result = await db.query<{
    id: string;
    name: string;
    role: string;
  }>(
    `SELECT cafe.id, cafe.name, cafe_member.role
   FROM cafe
   JOIN cafe_member ON cafe_member.cafe_id = cafe.id
   WHERE cafe_member.user_id = $1
   ORDER BY cafe.created_at, cafe.id`,
    [session.user.id],
  );

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">BlendHub Dashboard</h1>
      <p className="mt-3">Welcome, {session.user.name}!</p>
      <section className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Your cafés</h2>
          <Link
            href="/setup-cafe"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create a café
          </Link>
        </div>

        {result.rows.length === 0 ? (
          <p className="mt-2">You haven’t joined or created a café yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.rows.map((cafe) => (
              <article
                key={cafe.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold text-gray-900">{cafe.name}</h3>
                <span className="mt-3 inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium capitalize text-blue-800">
                  {cafe.role}
                </span>

                <Link
                  href={`/dashboard/cafe/${cafe.id}`}
                  className="mt-4 block text-sm font-medium text-blue-700 hover:underline"
                >
                  Open café
                </Link>
                
              </article>
            ))}
          </div>
        )}
      </section>
      <LinkGoogleButton />
      <LogoutButton />
    </main>
  );
}
