import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import TeamMemberForm from "./team-member-form";
import TeamMemberControls from "./team-member-controls";

type Props = {
  params: Promise<{ cafeId: string }>;
};

export default function TeamPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="p-6">Loading team...</p>}>
      <TeamContent params={params} />
    </Suspense>
  );
}

async function TeamContent({ params }: Props) {
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
       AND member.role = 'owner'`,
    [cafeId, session.user.id],
  );

  const cafe = cafeResult.rows[0];
  if (!cafe) notFound();

  const membersResult = await db.query<{
    user_id: string;
    name: string;
    email: string;
    role: string;
  }>(
    `SELECT member.user_id, person.name, person.email, member.role
     FROM cafe_member AS member
     JOIN "user" AS person ON person.id = member.user_id
     WHERE member.cafe_id::text = $1
       AND EXISTS (
         SELECT 1 FROM cafe_member AS owner
         WHERE owner.cafe_id = member.cafe_id
           AND owner.user_id = $2
           AND owner.role = 'owner'
       )
     ORDER BY member.created_at, member.user_id`,
    [cafeId, session.user.id],
  );

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link
        href={`/dashboard/cafe/${cafeId}`}
        className="text-sm text-blue-700 hover:underline"
      >
        Back to café
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">
        Team — {cafe.name}
      </h1>

      <TeamMemberForm cafeId={cafeId} />

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Current members</h2>

        <ul className="mt-4 space-y-3">
          {membersResult.rows.map((member) => (
            <li key={member.user_id} className="rounded-xl border p-4">
              <h3 className="font-semibold">{member.name}</h3>
              <p className="wrap-break-word text-sm text-gray-600">
                {member.email}
              </p>
              <p className="mt-2 text-sm font-medium capitalize">
                {member.role}
              </p>
              <TeamMemberControls
                key={`${member.user_id}-${member.role}`}
                cafeId={cafeId}
                memberUserId={member.user_id}
                memberName={member.name}
                currentRole={member.role}
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
