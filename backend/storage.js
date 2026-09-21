import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { backendLink } from "../config.js";
import { assetPath, resultsDir, uploadsDir } from "./paths.js";

const storageDriver = (process.env.STORAGE_DRIVER || "local").toLowerCase();
const remoteBaseUrl = process.env.STORAGE_PUBLIC_URL_BASE?.replace(/\/+$/, "");
const remoteUploadUrl = process.env.STORAGE_UPLOAD_URL?.replace(/\/+$/, "");
const remoteDeleteUrl = process.env.STORAGE_DELETE_URL?.replace(/\/+$/, "");
const remoteAuthToken = process.env.STORAGE_AUTH_TOKEN;

const kindToDir = {
  uploads: uploadsDir,
  results: resultsDir,
};

export const isLocalStorage = storageDriver === "local";

export function sanitizeFilename(filename) {
  const clean = path.basename(filename || "");
  if (!clean || clean === "." || clean === ".." || /[\\/]/.test(clean)) {
    throw new Error("Invalid filename");
  }
  return clean;
}

export function publicAssetUrl(kind, filename) {
  const clean = sanitizeFilename(filename);
  if (!["uploads", "results"].includes(kind)) throw new Error("Invalid asset kind");
  if (!isLocalStorage && remoteBaseUrl) return `${remoteBaseUrl}/${kind}/${encodeURIComponent(clean)}`;
  return `${backendLink}/api/${kind}/${encodeURIComponent(clean)}`;
}

async function requestRemote(method, kind, filename, body, contentType) {
  if (!remoteUploadUrl && method !== "DELETE") {
    throw new Error("STORAGE_UPLOAD_URL is required when STORAGE_DRIVER is not local");
  }

  const base = method === "DELETE" && remoteDeleteUrl ? remoteDeleteUrl : remoteUploadUrl;
  if (!base) return;

  const headers = {};
  if (remoteAuthToken) headers.Authorization = `Bearer ${remoteAuthToken}`;
  if (contentType) headers["Content-Type"] = contentType;

  const response = await fetch(`${base}/${kind}/${encodeURIComponent(filename)}`, {
    method,
    headers,
    body,
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Storage ${method} failed with ${response.status}`);
  }
}

export async function saveAsset(kind, filename, buffer, contentType = "application/octet-stream") {
  const clean = sanitizeFilename(filename);
  if (isLocalStorage) {
    const directory = kindToDir[kind];
    if (!directory) throw new Error("Invalid asset kind");
    await fsp.mkdir(directory, { recursive: true });
    await fsp.writeFile(path.join(directory, clean), buffer);
  } else {
    await requestRemote("PUT", kind, clean, buffer, contentType);
  }
  return publicAssetUrl(kind, clean);
}

export async function deleteAssetUrl(url) {
  const parsed = assetPath(url);
  if (!parsed) return;

  if (isLocalStorage) {
    try {
      if (fs.existsSync(parsed.path)) await fsp.unlink(parsed.path);
    } catch (error) {
      console.error("Failed to delete asset:", error.message);
    }
    return;
  }

  try {
    await requestRemote("DELETE", parsed.kind, parsed.filename);
  } catch (error) {
    console.error("Failed to delete remote asset:", error.message);
  }
}

export function serveAsset(kind) {
  return async (req, res, next) => {
    try {
      const filename = sanitizeFilename(req.params.filename);
      if (isLocalStorage) {
        const filePath = path.join(kindToDir[kind], filename);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Asset not found" });
        return res.sendFile(filePath);
      }
      if (remoteBaseUrl) return res.redirect(302, publicAssetUrl(kind, filename));
      return res.status(501).json({ error: "Persistent storage is not configured" });
    } catch (error) {
      next(error);
    }
  };
}

export async function readAssetBuffer(url) {
  const parsed = assetPath(url);
  if (!parsed) return null;

  if (isLocalStorage) {
    if (!fs.existsSync(parsed.path)) return null;
    return fsp.readFile(parsed.path);
  }

  const response = await fetch(publicAssetUrl(parsed.kind, parsed.filename));
  if (!response.ok) return null;
  return Buffer.from(await response.arrayBuffer());
}
