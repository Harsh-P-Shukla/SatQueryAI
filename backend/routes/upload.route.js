import express from "express";
import multer from "multer";
import path from "path";
import { saveAsset } from "../storage.js";

const router = express.Router();

// Multer instance used to parse multipart/form-data requests with single "image" field
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/upload
// - Accepts a single file under form field "image"
// - On success returns a JSON object with an accessible URL to the stored file
router.post("/", upload.single("image"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const fileName = `${Date.now()}${path.extname(req.file.originalname)}`;
    const imageUrl = await saveAsset("uploads", fileName, req.file.buffer, req.file.mimetype);
    res.json({ imageUrl });
  } catch (error) {
    next(error);
  }
});

export default router;
