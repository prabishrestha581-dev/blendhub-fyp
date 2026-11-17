import { cloudinary } from "./cloudinary";
import type { UploadApiResponse } from "cloudinary";

export async function uploadMenuImage(file: File) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Choose a JPG, PNG or WebP image.");
  }

  if (file.size === 0 || file.size > 2 * 1024 * 1024) {
    throw new Error("Choose an image smaller than or equal to 2 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<UploadApiResponse>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "blendhub/menu",
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (!result) {
            reject(new Error("Image upload failed."));
          } else {
            resolve(result);
          }
        },
      );

      stream.end(buffer);
    },
  );

  return {
    imageUrl: result.secure_url,
    imagePublicId: result.public_id,
  };
}