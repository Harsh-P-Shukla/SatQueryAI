import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

// Load backend/.env independently of the terminal's working directory.
const envPath = fileURLToPath(new URL("./.env", import.meta.url));
if (existsSync(envPath)) loadEnvFile(envPath);
