"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function addTeamMember(cafeId: string, formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Please sign in first." };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const role = String(formData.get("role") ?? "");

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  if (role !== "staff" && role !== "kitchen") {
    return { error: "Choose staff or kitchen." };
  }

  try {
    const result = await db.query(
      `INSERT INTO cafe_member (cafe_id, user_id, role)
       SELECT owner.cafe_id, target.id, $3
       FROM cafe_member AS owner
       JOIN "user" AS target ON lower(target.email) = $2
       WHERE owner.cafe_id::text = $1
         AND owner.user_id = $4
         AND owner.role = 'owner'
         AND target.id <> owner.user_id
       ON CONFLICT (cafe_id, user_id) DO NOTHING
       RETURNING user_id`,
      [cafeId, email, role, session.user.id],
    );

    if (result.rows.length === 0) {
      return {
        error:
          "Could not add this person. Check that you own this café and the email belongs to a registered user who is not already a member.",
      };
    }

    return { success: true };
  } catch {
    return { error: "Could not add the team member. Please try again." };
  }
}

export async function changeTeamMemberRole(
  cafeId: string,
  memberUserId: string,
  newRole: string,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Please sign in first." };
  }

  if (newRole !== "staff" && newRole !== "kitchen") {
    return { error: "Choose staff or kitchen." };
  }

  try {
    const result = await db.query(
      `UPDATE cafe_member AS member
       SET role = $3
       WHERE member.cafe_id::text = $1
         AND member.user_id = $2
         AND member.role IN ('staff', 'kitchen')
         AND member.user_id <> $4
         AND EXISTS (
           SELECT 1 FROM cafe_member AS owner
           WHERE owner.cafe_id = member.cafe_id
             AND owner.user_id = $4
             AND owner.role = 'owner'
         )
       RETURNING member.user_id`,
      [cafeId, memberUserId, newRole, session.user.id],
    );

    if (result.rows.length === 0) {
      return {
        error: "Member not found or you do not have permission.",
      };
    }

    return { success: true };
  } catch {
    return { error: "Could not change the role. Please try again." };
  }
}

export async function removeTeamMember(cafeId: string, memberUserId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Please sign in first." };
  }

  try {
    const result = await db.query(
      `DELETE FROM cafe_member AS member
       WHERE member.cafe_id::text = $1
         AND member.user_id = $2
         AND member.role IN ('staff', 'kitchen')
         AND member.user_id <> $3
         AND EXISTS (
           SELECT 1 FROM cafe_member AS owner
           WHERE owner.cafe_id = member.cafe_id
             AND owner.user_id = $3
             AND owner.role = 'owner'
         )
       RETURNING member.user_id`,
      [cafeId, memberUserId, session.user.id],
    );

    if (result.rows.length === 0) {
      return {
        error: "Member not found or you do not have permission.",
      };
    }

    return { success: true };
  } catch {
    return { error: "Could not remove the member. Please try again." };
  }
}
