"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cloudinary } from "@/lib/cloudinary";
import { uploadMenuImage } from "@/lib/upload-menu-image";

export async function createMenuItem(
  cafeId: string,
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