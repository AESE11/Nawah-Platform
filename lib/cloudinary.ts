import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

export const cloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

cloudinary.config({
  cloud_name: cloudName || "",
  api_key: apiKey || "",
  api_secret: apiSecret || "",
});

export function validateCloudinaryImageFile(file: File) {
  if (!file) {
    throw new Error("Image file is required.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
    throw new Error("Image size must be between 1 byte and 5MB.");
  }
}

export async function uploadCourseThumbnail(file: File) {
  if (!cloudinaryConfigured) {
    throw new Error("Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to the server environment.");
  }

  validateCloudinaryImageFile(file);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "course-thumbnails",
        resource_type: "image",
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(new Error("Thumbnail upload failed."));
          return;
        }

        resolve({
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
        });
      },
    );

    uploadStream.end(buffer);
  });

  return result;
}
