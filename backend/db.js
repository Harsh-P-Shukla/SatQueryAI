import "./env.js";
import pkg from "pg";
const { Pool } = pkg;

/**
 * PostgreSQL connection pool
 * - Uses node-postgres Pool to manage connections efficiently.
 * - Credentials are loaded from backend/.env or standard PG environment variables.
 * - The pool handles connection reuse and simple concurrency for queries made
 *   throughout the backend (import this `pool` and call pool.query(...)).
 */
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "isro_gi",
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT || 5432),
  connectionTimeoutMillis: 5000,
});

pool.on("error", (error) => {
  console.error("Idle PostgreSQL connection failed:", error.code || error.message);
});

/**
 * Export the configured pool instance.
 * - Consumers should `import pool from "./db.js"` and use pool.query(...) or
 *   acquire/release clients for transactions.
 */
export default pool;
