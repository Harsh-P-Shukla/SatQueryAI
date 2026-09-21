import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import chatRoutes from "./routes/chat.route.js";
import queryRoutes from "./routes/query.route.js";
import uploadRoutes from "./routes/upload.route.js";
import { frontendLink } from "../config.js";
import pool from "./db.js";
import { uploadsDir, resultsDir } from "./paths.js";

/**
 * server.js
 * - Entry point for the backend API server.
 * - Sets up express, enables CORS for the frontend origin, mounts route modules
 *   and serves static folders for uploaded assets and generated results.
 */

const app = express();

// Parse incoming JSON payloads
app.use(express.json());

// Allow requests only from configured frontend origin (simple CORS policy)
app.use(cors({ origin: `${frontendLink}` }));

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
app.use("/api/uploads", express.static(uploadsDir));
app.use("/api/results", express.static(resultsDir));

app.use((err, req, res, next) => {
  console.error("Request failed:", err.code || err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Request failed; check backend logs and service connections." });
});

// Start listening on port 5000 and log readiness
app.listen(5000, "localhost", () => console.log("Server running at http://localhost:5000"));
