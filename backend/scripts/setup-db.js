import "../env.js";
import pg from "pg";
import { readFile } from "node:fs/promises";

const database = process.env.PGDATABASE || "isro_gi";
if (!process.env.PGUSER || !process.env.PGPASSWORD) {
  throw new Error("Set PGUSER and PGPASSWORD in backend/.env before database setup.");
}
const options = {
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  connectionTimeoutMillis: 5000,
};
const admin = new pg.Client({ ...options, database: "postgres" });
try {
  await admin.connect();
  const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname=$1", [database]);
  if (!exists.rowCount) {
    const identifier = '"' + database.replaceAll('"', '""') + '"';
    await admin.query(`CREATE DATABASE ${identifier}`);
    console.log(`Created database ${database}`);
  }
} finally {
  await admin.end();
}
const client = new pg.Client({ ...options, database });
try {
  await client.connect();
  const schema = await readFile(new URL("../postgres.txt", import.meta.url), "utf8");
  await client.query("BEGIN");
  await client.query(schema.replaceAll("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS "));
  await client.query("COMMIT");
  console.log("Schema ready: users, chats, messages");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await client.end();
}
