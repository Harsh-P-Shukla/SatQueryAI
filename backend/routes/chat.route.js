import express from "express";
import pool from "../db.js";
import path from "path";
import PDFDocument from "pdfkit";
import { modelLink } from "../../config.js";
import axios from 'axios';
import { deleteAssetUrl, readAssetBuffer } from "../storage.js";

const router = express.Router();

/**
 * chat.route.js
 * - Routes handling chat/session lifecycle:
 *   - Create new chat (uploads image to model server and stores merged geometry)
 *   - List chats for a user
 *   - List messages for a chat
 *   - Delete a chat and associated on-disk artifacts
 *   - Generate a PDF report collating the chat timeline and images
 *
 * Notes:
 * - Many routes interact with the database (pool) and filesystem (uploads/results).
 * - The modelLink upload endpoint is used to obtain merged polygons/classes for images.
 */

/**
 * safeDelete
 * - Deletes a stored asset URL through the configured storage backend.
 */
export const safeDelete = (url) => deleteAssetUrl(url);

/* ------------------------------------------------------------------------------- */
/* POST /api/chat/new                                                              */
/* - Creates a new chat/session entry in the DB for the provided user and image    */
/* - Calls the model server `/upload` endpoint to compute merged_polys/merged_cls  */
/*   and stores those JSON blobs on the chat row for later numeric queries.        */
/* - Returns the newly inserted chat row.                                          */
/* ------------------------------------------------------------------------------- */
router.post("/new", async (req, res) => {
  const { userId, imageUrl, title } = req.body;
  if (!userId || !imageUrl || !title)
    return res
      .status(400)
      .json({ error: "Missing userId or imageUrl or title" });

  const fileName = path.basename(imageUrl);

  // Inform model server about the uploaded image so it can return merged geometry
  const response = await axios.post(`${modelLink}/upload`,{image_id: fileName, image_url: imageUrl});

  // Persist chat row including the merged polygons/classes returned by the model
  const result = await pool.query(
    "INSERT INTO chats (user_id, image_url, title, img_type, merged_polys, merged_cls, merged_source) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [userId, imageUrl, title, response.data.img_type, JSON.stringify(response.data.merged_polys), JSON.stringify(response.data.merged_cls), JSON.stringify(response.data.merged_source)]
  );
  res.json(result.rows[0]);
});

/* --------------------------------------------------------------------------- */
/* GET /api/chat/user/:userId                                                  */
/* - Retrieve all chats for the given user ordered by recent activity.         */
/* - Returns an array of chat rows to populate the history sidebar.            */
/* --------------------------------------------------------------------------- */
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  const result = await pool.query(
    "SELECT * FROM chats WHERE user_id=$1 ORDER BY updated_at DESC",
    [userId]
  );
  res.json(result.rows);
});

/* -------------------------------------------------------------------------- */
/* GET /api/chat/:chatId/messages                                             */
/* - Return chronological message history for a specific chat session.        */
/* - Messages include text answers and any generated image URLs.              */
/* -------------------------------------------------------------------------- */
router.get("/:chatId/messages", async (req, res) => {
  const { chatId } = req.params;
  const result = await pool.query(
    "SELECT * FROM messages WHERE chat_id=$1 ORDER BY created_at DESC",
    [chatId]
  );
  res.json(result.rows);
});

/* --------------------------------------------------------------------------- */
/* DELETE /api/chat/:chatId                                                    */
/* - Deletes a chat row and all associated message rows from the database.     */
/* - Attempts to remove any on-disk image artifacts referenced by the chat or  */
/*   messages (uploads and generated results).                                 */
/* - Uses safeDelete to avoid throwing on missing files.                       */
/* --------------------------------------------------------------------------- */
router.delete("/:chatId", async (req, res) => {
  const { chatId } = req.params;
  try {
    const chatRes = await pool.query(
      "SELECT image_url FROM chats WHERE id = $1",
      [chatId]
    );

    if (chatRes.rowCount === 0)
      return res.status(404).json({ error: "Chat not found" });

    // Collect asset URLs for the chat image and any generated message images
    const assetUrls = [chatRes.rows[0].image_url];

    const messageRes = await pool.query(
      "SELECT generated_image FROM messages WHERE chat_id = $1",
      [chatId]
    );

    // Collect generated image paths (if non-empty strings)
    for (const message of messageRes.rows) assetUrls.push(message.generated_image);

    // Delete stored assets if present
    for (const assetUrl of assetUrls.filter(Boolean)) await safeDelete(assetUrl);

    // Remove DB records (messages then the chat)
    await pool.query("DELETE FROM messages WHERE chat_id = $1", [chatId]);
    await pool.query("DELETE FROM chats WHERE id = $1", [chatId]);

    res.json({ message: "Chat deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting chat" });
  }
});

/* -------------------------------------------------------------------------- */
/* GET /api/chat/:chatId/report                                               */
/* - Generate a PDF report for the chat session containing:                   */
/*   - Uploaded image                                                         */
/*   - Chronological list of queries and model outputs                        */
/*   - Any generated images embedded inline                                   */
/* - The generated PDF is written to ./results and then sent to the client    */
/*   via res.download. Images are resolved from the uploads/results folders.  */
/* -------------------------------------------------------------------------- */
router.get("/:chatId/report", async (req, res) => {
  const { chatId } = req.params;

  // Load chat metadata and messages
  const chatResult = await pool.query("SELECT * FROM chats WHERE id=$1", [
    chatId,
  ]);
  if (chatResult.rows.length === 0)
    return res.status(404).json({ error: "Chat not found" });

  const chat = chatResult.rows[0];

  const messagesResult = await pool.query(
    "SELECT * FROM messages WHERE chat_id=$1 ORDER BY created_at ASC",
    [chatId]
  );
  const messages = messagesResult.rows;

  // Initialize a PDF document. The response is streamed directly so reports do
  // not depend on persistent filesystem writes in serverless production.
  const doc = new PDFDocument({
    margin: 40,
    autoFirstPage: true,
  });

  const fileName = `report_${chatId}_${Date.now()}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  doc.pipe(res);

  /**
   * ensureSpace
   * - Helper to add a new PDF page if there isn't enough vertical space remaining.
   */
  const ensureSpace = (heightNeeded = 50) => {
    const bottom = doc.page.height - doc.page.margins.bottom;
    if (doc.y + heightNeeded > bottom) doc.addPage();
  };

  /**
   * safeAddImage
   * - Safely embeds an image into the PDF if the referenced file exists.
   * - Resolves remote-looking URLs back to local uploads/results folders.
   * - Catches errors to keep PDF generation resilient.
   */
  const safeAddImage = async (imgPath, width = 350) => {
    try {
      if (!imgPath) return;

      const imageBuffer = await readAssetBuffer(imgPath);
      if (!imageBuffer) {
        console.error("Image not found:", imgPath);
        return;
      }

      ensureSpace(250);
      doc.image(imageBuffer, { fit: [width, 250], align: "left" });
      doc.moveDown(1);
    } catch (err) {
      console.error("safeAddImage error:", err);
    }
  };

  // Document header metadata and uploaded image preview
  doc.fontSize(26).text("SatQuery AI – Analysis Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Chat ID: ${chatId}`);
  doc.text(`Created At: ${new Date(chat.created_at).toLocaleString()}`);
  doc.moveDown(2);

  doc
    .moveTo(doc.x, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(2);

  doc.fontSize(18).text("Uploaded Image:", { underline: true });
  doc.moveDown(1);

  await safeAddImage(chat.image_url);
  doc.moveDown(1.5);

  doc.fontSize(20).text("Analysis Timeline:", { underline: true });
  doc.moveDown();

  // Iterate messages and include query, model output and any generated image
  for (const [index, msg] of messages.entries()) {
    ensureSpace(80);
    doc.fontSize(16).text(`Query ${index + 1}`);
    doc.moveDown(0.5);

    doc.fontSize(12).text(`User: ${msg.query}`, { width: 500 });
    doc.moveDown(0.5);

    doc.fontSize(12).text(`Model Output: ${msg.text_answer}`, { width: 500 });
    doc.moveDown(1);

    if (msg.generated_image) {
      doc.fontSize(12).text("Generated Image:");
      doc.moveDown(0.5);
      await safeAddImage(msg.generated_image);
    }

    doc.moveDown(1);

    doc
      .moveTo(doc.x, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();
    doc.moveDown(1.5);
  }

  ensureSpace(100);
  doc.moveDown(2);
  doc
    .fontSize(10)
    .text("Generated by SatQuery AI — Satellite Query AI Assistant", {
      align: "center",
    });

  doc.end();
});

export default router;
