import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const localStorageRoot = process.env.LOCAL_STORAGE_ROOT
  ? path.resolve(process.env.LOCAL_STORAGE_ROOT)
  : fileURLToPath(new URL(".", import.meta.url));

export const uploadsDir = path.join(localStorageRoot, "uploads");
export const resultsDir = path.join(localStorageRoot, "results");
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
  const kind = match[1];
  return {
    kind,
    filename,
    path: path.join(kind === "uploads" ? uploadsDir : resultsDir, filename),
  };
}
