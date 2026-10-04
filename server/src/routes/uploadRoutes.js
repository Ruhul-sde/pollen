import express from "express";
import fs from "fs";
import path from "path";
import { uploadSingleImage, uploadMultipleImages } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Helper to construct full or relative URL
function getFileUrl(req, filename) {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:5001";
  return `${protocol}://${host}/uploads/${filename}`;
}

/**
 * POST /api/v1/upload (or /api/v1/admin/upload)
 * Single image file upload
 */
router.post("/", (req, res) => {
  uploadSingleImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to upload image",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided in request (field name should be 'image')",
      });
    }

    const url = getFileUrl(req, req.file.filename);
    const relativeUrl = `/uploads/${req.file.filename}`;

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      url,
      relativeUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  });
});

/**
 * POST /api/v1/upload/multiple
 * Multiple image files upload
 */
router.post("/multiple", (req, res) => {
  uploadMultipleImages(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to upload images",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No image files provided (field name should be 'images')",
      });
    }

    const uploaded = req.files.map((file) => ({
      url: getFileUrl(req, file.filename),
      relativeUrl: `/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
    }));

    res.status(201).json({
      success: true,
      message: `${req.files.length} images uploaded successfully`,
      data: uploaded,
      urls: uploaded.map((u) => u.url),
    });
  });
});

/**
 * POST /api/v1/upload/base64
 * Base64 image string upload
 */
router.post("/base64", (req, res) => {
  try {
    const { base64, name } = req.body;
    if (!base64 || typeof base64 !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid base64 string is required",
      });
    }

    const matches = base64.match(/^data:image\/([a-zA-Z0-9+-]+);base64,(.+)$/);
    let ext = ".png";
    let dataBuffer;

    if (matches && matches.length === 3) {
      const format = matches[1].toLowerCase();
      ext = format === "jpeg" ? ".jpg" : `.${format}`;
      dataBuffer = Buffer.from(matches[2], "base64");
    } else {
      dataBuffer = Buffer.from(base64, "base64");
    }

    const uploadDir = path.resolve(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `fragrance-${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, dataBuffer);

    const url = getFileUrl(req, filename);
    const relativeUrl = `/uploads/${filename}`;

    res.status(201).json({
      success: true,
      message: "Base64 image saved successfully",
      url,
      relativeUrl,
      filename,
      size: dataBuffer.length,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Failed to process base64 image",
    });
  }
});

export default router;
