import { v2 as cloudinary } from "cloudinary";

const cloudinaryUrl = process.env.CLOUDINARY_URL || "";

if (!cloudinaryUrl) {
  throw new Error("CLOUDINARY_URL is required");
}

cloudinary.config({
  cloudinary_url: cloudinaryUrl,
});

export { cloudinary };
