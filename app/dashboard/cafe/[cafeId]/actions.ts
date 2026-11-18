"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cloudinary } from "@/lib/cloudinary";
import { uploadMenuImage } from "@/lib/upload-menu-image";

export async function createMenuItem(cafeId: string, formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Please sign in first." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim();
  const image = formData.get("image");

  if (!name || name.length > 100) {
    return { error: "Enter an item name of up to 100 characters." };
  }

  if (!category || category.length > 50) {
    return { error: "Enter a category of up to 50 characters." };
  }

  if (!/^\d{1,8}(\.\d{1,2})?$/.test(price)) {
    return { error: "Enter a valid price with up to 2 decimal places." };
  }

  const photo = image instanceof File && image.size > 0 ? image : null;

  if (photo) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
      return { error: "Choose a JPG, PNG or WebP image." };
    }

    if (photo.size > 2 * 1024 * 1024) {
      return { error: "The photo must be 2 MB or smaller." };
    }
  }

  let uploadedImage: {
    imageUrl: string;
    imagePublicId: string;
  } | null = null;

  try {
    // Check ownership before uploading anything.
    const membership = await db.query(
      `SELECT 1 FROM cafe_member
       WHERE cafe_id::text = $1
         AND user_id = $2
         AND role = 'owner'`,
      [cafeId, session.user.id],
    );

    if (membership.rows.length === 0) {
      return { error: "Only this café's owner can add menu items." };
    }

    if (photo) {
      uploadedImage = await uploadMenuImage(photo);
    }

    // Check ownership again as part of the insert.
    const result = await db.query(
      `INSERT INTO menu_item
         (cafe_id, name, category, price, image_url, image_public_id)
       SELECT cafe_id, $3, $4, $5::numeric, $6, $7
       FROM cafe_member
       WHERE cafe_id::text = $1
         AND user_id = $2
         AND role = 'owner'
       RETURNING id`,
      [
        cafeId,
        session.user.id,
        name,
        category,
        price,
        uploadedImage?.imageUrl ?? null,
        uploadedImage?.imagePublicId ?? null,
      ],
    );

    if (result.rows.length === 0) {
      throw new Error("Ownership changed before saving.");
    }

    return { success: true };
  } catch {
    // Remove the uploaded photo if saving the item failed.
    if (uploadedImage) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.imagePublicId);
      } catch {
        console.error("Could not clean up an unused menu photo.");
      }
    }

    return {
      error: "Could not save the item or upload its photo. Please try again.",
    };
  }
}

export async function updateMenuItem(
  cafeId: string,
  itemId: string,
  formData: FormData,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Please sign in first." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim();
  const image = formData.get("image");
  const photo = image instanceof File && image.size > 0 ? image : null;

  if (!name || name.length > 100) {
    return { error: "Enter an item name of up to 100 characters." };
  }

  if (!category || category.length > 50) {
    return { error: "Enter a category of up to 50 characters." };
  }

  if (!/^\d{1,8}(\.\d{1,2})?$/.test(price)) {
    return { error: "Enter a valid price with up to 2 decimal places." };
  }

  if (photo) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
      return { error: "Choose a JPG, PNG or WebP image." };
    }

    if (photo.size > 2 * 1024 * 1024) {
      return { error: "The photo must be 2 MB or smaller." };
    }
  }

  let oldImagePublicId: string | null = null;
  let uploadedImage: {
    imageUrl: string;
    imagePublicId: string;
  } | null = null;

  try {
    // Check ownership and read the existing photo identifier.
    const existing = await db.query<{
      image_public_id: string | null;
    }>(
      `SELECT item.image_public_id
       FROM menu_item AS item
       JOIN cafe_member AS member ON member.cafe_id = item.cafe_id
       WHERE item.id::text = $1
         AND item.cafe_id::text = $2
         AND member.user_id = $3
         AND member.role = 'owner'`,
      [itemId, cafeId, session.user.id],
    );

    if (existing.rows.length === 0) {
      return { error: "Item not found or permission denied." };
    }

    oldImagePublicId = existing.rows[0].image_public_id;

    if (photo) {
      uploadedImage = await uploadMenuImage(photo);
    }

    const result = await db.query(
      `UPDATE menu_item AS item
       SET name = $4,
           category = $5,
           price = $6::numeric,
           image_url = COALESCE($7::text, item.image_url),
           image_public_id = COALESCE($8::text, item.image_public_id)
       FROM cafe_member AS member
       WHERE item.id::text = $1
         AND item.cafe_id::text = $2
         AND member.cafe_id = item.cafe_id
         AND member.user_id = $3
         AND member.role = 'owner'
         AND (
           $8::text IS NULL
           OR item.image_public_id IS NOT DISTINCT FROM $9::text
         )
       RETURNING item.id`,
      [
        itemId,
        cafeId,
        session.user.id,
        name,
        category,
        price,
        uploadedImage?.imageUrl ?? null,
        uploadedImage?.imagePublicId ?? null,
        oldImagePublicId,
      ],
    );

    if (result.rows.length === 0) {
      throw new Error("Item or permissions changed before saving.");
    }
  } catch {
    // If saving failed, attempt to remove the new upload.
    if (uploadedImage) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.imagePublicId);
      } catch {
        console.error("Could not clean up the new menu photo.");
      }
    }

    return {
      error: "Could not update the item. Refresh the page and try again.",
    };
  }

  // The new photo is saved. Now attempt to remove the old one.
  if (uploadedImage && oldImagePublicId) {
    try {
      await cloudinary.uploader.destroy(oldImagePublicId);
    } catch {
      console.error("Item updated, but old photo cleanup failed.");
    }
  }

  return { success: true };
}

export async function setMenuItemAvailability(
  cafeId: string,
  itemId: string,
  isAvailable: boolean,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Please sign in first." };
  }

  if (typeof isAvailable !== "boolean") {
    return { error: "Invalid availability value." };
  }

  try {
    const result = await db.query(
      `UPDATE menu_item AS item
       SET is_available = $4
       FROM cafe_member AS member
       WHERE item.id::text = $1
         AND item.cafe_id::text = $2
         AND member.cafe_id = item.cafe_id
         AND member.user_id = $3
         AND member.role = 'owner'
       RETURNING item.id`,
      [itemId, cafeId, session.user.id, isAvailable],
    );

    if (result.rows.length === 0) {
      return { error: "Item not found or permission denied." };
    }

    return { success: true };
  } catch {
    return { error: "Could not update availability. Please try again." };
  }
}

export async function deleteMenuItem(
  cafeId: string,
  itemId: string,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Please sign in first." };
  }

  let deletedItem: { image_public_id: string | null };

  try {
    const result = await db.query<{
      image_public_id: string | null;
    }>(
      `DELETE FROM menu_item AS item
       USING cafe_member AS member
       WHERE item.id::text = $1
         AND item.cafe_id::text = $2
         AND member.cafe_id = item.cafe_id
         AND member.user_id = $3
         AND member.role = 'owner'
       RETURNING item.image_public_id`,
      [itemId, cafeId, session.user.id],
    );

    if (result.rows.length === 0) {
      return { error: "Item not found or permission denied." };
    }

    deletedItem = result.rows[0];
  } catch {
    return { error: "Could not delete the item. Please try again." };
  }

  if (deletedItem.image_public_id) {
    try {
      await cloudinary.uploader.destroy(deletedItem.image_public_id);
    } catch {
      console.error("Item deleted, but its photo cleanup failed.");
    }
  }

  return { success: true };
}
