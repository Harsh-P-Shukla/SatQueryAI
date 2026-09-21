import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const uploadsDir = fileURLToPath(new URL("./uploads/", import.meta.url));
export const resultsDir = fileURLToPath(new URL("./results/", import.meta.url));
for (const directory of [uploadsDir, resultsDir]) {
  mkdirSync(directory, { recursive: true });
}

export function assetPath(url) {
  if (!url) return null;
  const pathname = new URL(url, "http://localhost:5000").pathname;
  const match = pathname.match(/^\/api\/(uploads|results)\/([^/]+)$/);
  if (!match) return null;
  const filename = decodeURIComponent(match[2]);
  if (filename !== path.basename(filename) || /[\\/]/.test(filename) || filename === "." || filename === "..") return null;
  return path.join(match[1] === "uploads" ? uploadsDir : resultsDir, filename);
}
