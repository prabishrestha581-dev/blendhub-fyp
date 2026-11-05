"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function createCafe(
  _previousState: { error: string },
  formData: FormData,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  const value = formData.get("name");
  const name = typeof value === "string" ? value.trim() : "";

  if (name.length === 0 || name.length > 100) {
    return { error: "Enter a café name between 1 and 100 characters." };
  }

  try {
    const client = await db.connect();

    try {
      await client.query("BEGIN ISOLATION LEVEL READ COMMITTED");

      // Make simultaneous requests from this user wait their turn.
      await client.query('SELECT id FROM "user" WHERE id = $1 FOR UPDATE', [
        session.user.id,
      ]);

      const existing = await client.query(
        `SELECT 1
       FROM cafe
       JOIN cafe_member ON cafe_member.cafe_id = cafe.id
       WHERE cafe_member.user_id = $1
         AND cafe_member.role = 'owner'
         AND lower(trim(cafe.name)) = lower($2)
       LIMIT 1`,
        [session.user.id, name],
      );

      if (existing.rows.length > 0) {
        await client.query("ROLLBACK");
        return { error: "You already have a café with this name." };
      }

      await client.query(
        `WITH new_cafe AS (
        INSERT INTO cafe (name)
        VALUES ($1)
        RETURNING id
      )
      INSERT INTO cafe_member (cafe_id, user_id, role)
      SELECT id, $2, 'owner' FROM new_cafe`,
        [name, session.user.id],
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch {
    return { error: "Could not create your café. Please try again." };
  }

  redirect("/dashboard");
}
