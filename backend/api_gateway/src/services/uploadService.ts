import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary";

const uploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || "cnweb";

export async function uploadImageToCloudinary(fileBuffer: Buffer, originalName: string): Promise<UploadApiResponse> {
  const publicId = originalName
    .replace(/\.[^/.]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || `image-${Date.now()}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: uploadFolder,
        resource_type: "image",
        public_id: `${publicId}-${Date.now()}`,
      },
      (error, result) => {
        if (error) {
          const message = typeof error === "object" && error && "message" in error
            ? String(error.message)
            : "Cloudinary upload failed";
          reject(new Error(message));
          return;
        }

        resolve(result as UploadApiResponse);
      },
    );

    stream.end(fileBuffer);
  });
}
