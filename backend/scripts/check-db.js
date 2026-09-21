import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pool from "../db.js";

const client = await pool.connect();
try {
  await client.query("BEGIN");
  const email = `db-check-${randomUUID()}@example.invalid`;
  const { rows: [user] } = await client.query(
    "INSERT INTO users (name,email,password) VALUES ($1,$2,$3) RETURNING id",
    ["Database smoke test", email, "test-only-not-a-login"],
  );
  const { rows: [chat] } = await client.query(
    "INSERT INTO chats (user_id,image_url,title,merged_polys) VALUES ($1,$2,$3,$4) RETURNING id",
    [user.id, "http://localhost:5000/api/uploads/test.png", "Database smoke test", JSON.stringify([[1,2]])],
  );
  const { rows: [message] } = await client.query(
    "INSERT INTO messages (chat_id,query,text_answer) VALUES ($1,$2,$3) RETURNING id",
    [chat.id, "test query", "test answer"],
  );
  const joined = await client.query(
    "SELECT u.email,c.merged_polys,m.text_answer FROM users u JOIN chats c ON c.user_id=u.id JOIN messages m ON m.chat_id=c.id WHERE m.id=$1",
    [message.id],
  );
  assert.equal(joined.rows[0].email, email);
  assert.deepEqual(joined.rows[0].merged_polys, [[1,2]]);
  assert.equal(joined.rows[0].text_answer, "test answer");
  for (const [sql, args, expected] of [
    ["INSERT INTO messages (chat_id,query) VALUES ($1,$2)", [-1,"invalid FK"], "23503"],
    ["INSERT INTO chats (user_id,image_url) VALUES ($1,$2)", [-1,"invalid FK"], "23503"],
    ["INSERT INTO users (email,password) VALUES ($1,$2)", [email,"duplicate"], "23505"],
  ]) {
    await client.query("SAVEPOINT constraint_check");
    await assert.rejects(client.query(sql,args), { code: expected });
    await client.query("ROLLBACK TO SAVEPOINT constraint_check");
  }
  await client.query("DELETE FROM users WHERE id=$1", [user.id]);
  assert.equal((await client.query("SELECT 1 FROM chats WHERE id=$1",[chat.id])).rowCount, 0);
  assert.equal((await client.query("SELECT 1 FROM messages WHERE id=$1",[message.id])).rowCount, 0);
  console.log("PASS: connection, INSERT/SELECT, JSONB, unique email, both foreign keys and cascading deletion");
} finally {
  await client.query("ROLLBACK");
  client.release();
  await pool.end();
}
