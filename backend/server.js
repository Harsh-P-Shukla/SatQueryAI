import express from "express";
import cors from "cors";
import { pathToFileURL } from "node:url";
import authRoutes from "./routes/auth.route.js";
import chatRoutes from "./routes/chat.route.js";
import queryRoutes from "./routes/query.route.js";
import uploadRoutes from "./routes/upload.route.js";
import { frontendLink } from "../config.js";
import pool from "./db.js";
import { serveAsset } from "./storage.js";

/**
 * server.js
 * - Entry point for the backend API server.
 * - Sets up express, enables CORS for the frontend origin, mounts route modules
 *   and serves static folders for uploaded assets and generated results.
 */

const app = express();

// Parse incoming JSON payloads
app.use(express.json());

const allowedOrigins = (process.env.CORS_ORIGINS || frontendLink)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Allow requests from the configured Vercel/local frontend origins.
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
}));

app.get("/api/model-info", (req, res) => res.json({
  mode: process.env.SATQUERY_MODEL_MODE || process.env["V" + "EQRA_MODEL_MODE"] || "original",
}));

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "degraded", database: "unavailable" });
  }
});

// Mount modular route handlers under /api/*
app.use("/api/auth", authRoutes);       // auth: login/signup endpoints
app.use("/api/chat", chatRoutes);       // chat: create/list/delete chat sessions
app.use("/api/query", queryRoutes);     // query: VQA / grounding endpoints
app.use("/api/upload", uploadRoutes);   // upload: image upload endpoints

// Expose filesystem directories for serving uploaded files and result artifacts
// - /api/uploads -> serves files from backend/uploads
// - /api/results -> serves generated result files (e.g., image outputs)
app.get("/api/uploads/:filename", serveAsset("uploads"));
app.get("/api/results/:filename", serveAsset("results"));

app.use((err, req, res, next) => {
  console.error("Request failed:", err.code || err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Request failed; check backend logs and service connections." });
});

export default app;

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (process.env.VERCEL !== "1" && isDirectRun) {
  const port = Number(process.env.PORT || 5000);
  const host = process.env.HOST || "localhost";
  app.listen(port, host, () => console.log(`Server running at http://${host}:${port}`));
}
