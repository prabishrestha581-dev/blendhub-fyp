"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function updateOrderStatus(
  cafeId: string,
  orderId: string,
  nextStatus: string,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Please sign in first." };
  }

  let allowedCurrentStatuses: string[];
  let allowedRoles: string[];

  switch (nextStatus) {
    case "accepted":
      allowedCurrentStatuses = ["pending"];
      allowedRoles = ["owner", "staff"];
      break;
    case "preparing":
      allowedCurrentStatuses = ["accepted"];
      allowedRoles = ["owner", "staff", "kitchen"];
      break;
    case "ready":
      allowedCurrentStatuses = ["preparing"];
      allowedRoles = ["owner", "staff", "kitchen"];
      break;
    case "completed":
      allowedCurrentStatuses = ["ready"];
      allowedRoles = ["owner", "staff"];
      break;
    case "cancelled":
      allowedCurrentStatuses = ["pending", "accepted"];
      allowedRoles = ["owner", "staff"];
      break;
    default:
      return { error: "Invalid order status." };
  }

  try {
    const result = await db.query(
      `UPDATE cafe_order AS orders
       SET status = $4
       FROM cafe_member AS member
       WHERE orders.id::text = $1
         AND orders.cafe_id::text = $2
         AND member.cafe_id = orders.cafe_id
         AND member.user_id = $3
         AND member.role = ANY($6::text[])
         AND orders.status = ANY($5::text[])
       RETURNING orders.id`,
      [
        orderId,
        cafeId,
        session.user.id,
        nextStatus,
        allowedCurrentStatuses,
        allowedRoles,
      ],
    );

    if (result.rows.length === 0) {
      return {
        error:
          "The order changed or you do not have permission. Refresh the page.",
      };
    }

    return { success: true };
  } catch {
    return { error: "Could not update the order. Please try again." };
  }
}
