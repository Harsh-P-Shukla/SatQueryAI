import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import pool from "../db.js";
import { assetPath } from "../paths.js";

const base = "http://localhost:5000";
const email = `e2e-${randomUUID()}@example.invalid`;
const password = randomUUID();
let userId, chatId, imageUrl;
const results = {};
const post = async (route, payload) => {
  const started = Date.now();
  const response = await fetch(base + route, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    signal: AbortSignal.timeout(600000),
  });
  const body = await response.json();
  assert.equal(response.status, 200, `${route}: ${JSON.stringify(body)}`);
  console.log(`PASS ${route} (${((Date.now()-started)/1000).toFixed(1)}s)`);
  return body;
};
try {
  const inference = await fetch("http://127.0.0.1:8000/health");
  assert.equal(inference.status, 200);
  results.inference = await inference.json();
  const user = await post("/api/auth/signup", { name: "E2E smoke test", email, password });
  userId = user.id;
  assert.equal((await post("/api/auth/login", { email, password })).id, userId);
  const bytes = await readFile(new URL("../../frontend/public/display 1.png", import.meta.url));
  const form = new FormData();
  form.append("image", new Blob([bytes], { type: "image/png" }), "aircraft-smoke.png");
  const uploaded = await fetch(base + "/api/upload", { method: "POST", body: form });
  assert.equal(uploaded.status, 200);
  imageUrl = (await uploaded.json()).imageUrl;
  const chat = await post("/api/chat/new", { userId, imageUrl, title: "Aircraft smoke test" });
  chatId = chat.id;
  results.detections = { count: chat.merged_cls.length, classes: chat.merged_cls, sources: chat.merged_source };
  results.caption = await post("/api/query/caption", { chatId });
  assert.ok(results.caption.caption?.trim());
  for (const [queryType, query] of [
    ["semantic", "What kind of location is shown?"],
    ["binary", "Are there airplanes in this image?"],
    ["numeric", "How many airplanes are visible?"],
  ]) {
    results[queryType] = await post("/api/query/vqa", { chatId, queryType, query });
    assert.ok(String(results[queryType].text_answer).trim());
  }
  results.grounding = await post("/api/query/grounding", { chatId, query: "Locate all airplanes" });
  const grounded = await fetch(results.grounding.generated_image);
  assert.equal(grounded.status, 200);
  assert.ok((await grounded.arrayBuffer()).byteLength > 1000);
  const messages = await (await fetch(base + `/api/chat/${chatId}/messages`)).json();
  assert.equal(messages.length, 4);
  const history = await (await fetch(base + `/api/chat/user/${userId}`)).json();
  assert.equal(history[0].caption, results.caption.caption);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM messages WHERE chat_id=$1", [chatId])).rows[0].n, 4);
  const report = await fetch(base + `/api/chat/${chatId}/report`);
  assert.equal(report.status, 200);
  assert.equal(Buffer.from(await report.arrayBuffer()).subarray(0,4).toString(), "%PDF");
  results.evaluation = await post("/api/query/evaluate", { input_image: { image_url: imageUrl }, queries: { caption_query: { instruction: "Describe this scene briefly." } } });
  assert.ok(results.evaluation.queries.caption_query.response);
  const deleted = await fetch(base + `/api/chat/${chatId}`, { method: "DELETE" });
  assert.equal(deleted.status, 200);
  assert.equal((await pool.query("SELECT 1 FROM messages WHERE chat_id=$1", [chatId])).rowCount, 0);
  assert.equal((await fetch(imageUrl)).status, 404);
  assert.equal((await fetch(results.grounding.generated_image)).status, 404);
  const destination = new URL("../.cache/e2e-results.json", import.meta.url);
  await mkdir(new URL("../.cache/", import.meta.url), { recursive: true });
  await writeFile(destination, JSON.stringify(results, null, 2));
  console.log("PASS: caption, all VQA types, grounding retrieval, chat/message persistence, PDF, partial evaluation and chat deletion");
  console.log(JSON.stringify({ detections: results.detections, caption: results.caption, semantic: results.semantic.text_answer, binary: results.binary.text_answer, numeric: results.numeric.text_answer }));
} finally {
  if (userId) await pool.query("DELETE FROM users WHERE id=$1", [userId]);
  await pool.end();
  for (const url of [imageUrl, results.grounding?.generated_image].filter(Boolean)) {
    await unlink(assetPath(url)).catch(error => { if (error.code !== "ENOENT") throw error; });
  }
}
