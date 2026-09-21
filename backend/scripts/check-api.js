import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcrypt";
import pool from "../db.js";
import { uploadsDir } from "../paths.js";

const base = "http://localhost:5000";
const email = `api-check-${randomUUID()}@example.invalid`;
const password = randomUUID(); // Temporary test account only; never logged.
let uploadedPath;
const post = (route, body) => fetch(base + route, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});
try {
  const health = await fetch(base + "/api/health", { headers: { Origin: "http://localhost:5173" } });
  assert.equal(health.status, 200);
  assert.equal(health.headers.get("access-control-allow-origin"), "http://localhost:5173");
  const signup = await post("/api/auth/signup", { name: "API smoke test", email, password });
  assert.equal(signup.status, 200);
  const user = await signup.json();
  assert.equal(user.email, email);
  assert.equal(user.password, undefined);
  // A separate pool connection verifies persistence beyond the HTTP request.
  const persisted = await pool.query("SELECT password FROM users WHERE id=$1", [user.id]);
  assert.equal(await bcrypt.compare(password, persisted.rows[0].password), true);
  assert.notEqual(persisted.rows[0].password, password);
  const login = await post("/api/auth/login", { email, password });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).id, user.id);
  assert.equal((await post("/api/auth/login", { email, password: "wrong-test-password" })).status, 400);
  assert.equal((await post("/api/auth/signup", { name: "duplicate", email, password })).status, 400);
  const history = await fetch(base + `/api/chat/user/${user.id}`);
  assert.equal(history.status, 200);
  assert.deepEqual(await history.json(), []);

  const bytes = await readFile(new URL("../../frontend/public/display 1.png", import.meta.url));
  const form = new FormData();
  form.append("image", new Blob([bytes], { type: "image/png" }), "setup-check.png");
  const upload = await fetch(base + "/api/upload", { method: "POST", body: form });
  assert.equal(upload.status, 200);
  const { imageUrl } = await upload.json();
  assert.ok(imageUrl.startsWith(base + "/api/uploads/"));
  uploadedPath = path.join(uploadsDir, path.basename(new URL(imageUrl).pathname));
  const image = await fetch(imageUrl);
  assert.equal(image.status, 200);
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), bytes);
  console.log("PASS: health, CORS, registration, persisted bcrypt hash, login, wrong password, duplicate email, empty history, upload and exact image retrieval");
} finally {
  await pool.query("DELETE FROM users WHERE email=$1", [email]);
  await pool.end();
  if (uploadedPath) await unlink(uploadedPath);
}
