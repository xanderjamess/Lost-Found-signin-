import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";

export const uploadRouter = Router();

uploadRouter.post("/upload-image", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image data provided" });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn("Cloudinary configuration remains incomplete on the server.");
      return res.status(503).json({
        error:
          "Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to the environment variables.",
      });
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const uploadResult = await cloudinary.uploader.upload(image, {
      folder: "campus_lost_found",
    });

    res.json({
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to upload image to Cloudinary";
    console.error("Cloudinary upload failed:", e);
    res.status(500).json({ error: message });
  }
});
