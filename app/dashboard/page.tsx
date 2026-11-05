import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LogoutButton from "./logout-button";
import { db } from "@/lib/db";

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
        <h2 className="text-xl font-semibold">Your cafés</h2>

        {result.rows.length === 0 ? (
          <p className="mt-2">You haven’t joined or created a café yet.</p>
        ) : (
          result.rows.map((cafe) => (
            <div key={cafe.id} className="mt-3 rounded-lg border p-4">
              <h3 className="font-medium">{cafe.name}</h3>
              <p className="text-sm text-gray-600">Role: {cafe.role}</p>
            </div>
          ))
        )}
      </section>
      <LogoutButton />
    </main>
  );
}
