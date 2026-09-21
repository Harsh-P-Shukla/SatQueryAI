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
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
    }
  : {
      user: process.env.PGUSER,
      host: process.env.PGHOST || "localhost",
      database: process.env.PGDATABASE || "isro_gi",
      password: process.env.PGPASSWORD,
      port: Number(process.env.PGPORT || 5432),
      ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool({
  ...poolConfig,
  connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5000),
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
