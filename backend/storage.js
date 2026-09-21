import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { backendLink } from "../config.js";
import { assetPath, resultsDir, uploadsDir } from "./paths.js";

const storageDriver = (process.env.STORAGE_DRIVER || "local").toLowerCase();

const kindToDir = {
  uploads: uploadsDir,
  results: resultsDir,
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  storageDriver === "supabase" && supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

export const isLocalStorage = storageDriver === "local";

function getBucket(kind) {
  if (!["uploads", "results"].includes(kind)) {
    throw new Error("Invalid asset kind");
  }

  return kind;
}

export function sanitizeFilename(filename) {
  const clean = path.basename(filename || "");

  if (
    !clean ||
    clean === "." ||
    clean === ".." ||
    /[\\/]/.test(clean)
  ) {
    throw new Error("Invalid filename");
  }

  return clean;
}

export function publicAssetUrl(kind, filename) {
  const clean = sanitizeFilename(filename);
  const bucket = getBucket(kind);

  if (storageDriver === "supabase") {
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL is required for Supabase storage");
    }

    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(clean)}`;
  }

  return `${backendLink}/api/${bucket}/${encodeURIComponent(clean)}`;
}

export async function saveAsset(
  kind,
  filename,
  buffer,
  contentType = "application/octet-stream"
) {
  const clean = sanitizeFilename(filename);
  const bucket = getBucket(kind);

  if (isLocalStorage) {
    const directory = kindToDir[bucket];

    await fsp.mkdir(directory, { recursive: true });
    await fsp.writeFile(path.join(directory, clean), buffer);

    return publicAssetUrl(bucket, clean);
  }

  if (storageDriver === "supabase") {
    if (!supabase) {
      throw new Error(
        "Supabase storage is not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      );
    }

    const { error } = await supabase.storage
      .from(bucket)
      .upload(clean, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase storage upload failed: ${error.message}`);
    }

    return publicAssetUrl(bucket, clean);
  }

  throw new Error(`Unsupported storage driver: ${storageDriver}`);
}

export async function deleteAssetUrl(url) {
  if (!url) return;

  if (storageDriver === "supabase") {
    if (!supabase) return;

    try {
      const parsed = new URL(url);

      const match = parsed.pathname.match(
        /\/storage\/v1\/object\/public\/(uploads|results)\/(.+)$/
      );

      if (!match) return;

      const kind = match[1];
      const filename = sanitizeFilename(
        decodeURIComponent(match[2])
      );

      const { error } = await supabase.storage
        .from(kind)
        .remove([filename]);

      if (error) {
        console.error(
          "Failed to delete Supabase asset:",
          error.message
        );
      }
    } catch (error) {
      console.error(
        "Failed to delete Supabase asset:",
        error.message
      );
    }

    return;
  }

  const parsed = assetPath(url);
  if (!parsed) return;

  if (isLocalStorage) {
    try {
      if (fs.existsSync(parsed.path)) {
        await fsp.unlink(parsed.path);
      }
    } catch (error) {
      console.error("Failed to delete asset:", error.message);
    }
  }
}

export function serveAsset(kind) {
  return async (req, res, next) => {
    try {
      const filename = sanitizeFilename(req.params.filename);
      const bucket = getBucket(kind);

      if (isLocalStorage) {
        const filePath = path.join(
          kindToDir[bucket],
          filename
        );

        if (!fs.existsSync(filePath)) {
          return res
            .status(404)
            .json({ error: "Asset not found" });
        }

        return res.sendFile(filePath);
      }

      if (storageDriver === "supabase") {
        return res.redirect(
          302,
          publicAssetUrl(bucket, filename)
        );
      }

      return res
        .status(501)
        .json({
          error: "Persistent storage is not configured",
        });
    } catch (error) {
      next(error);
    }
  };
}

export async function readAssetBuffer(url) {
  if (!url) return null;

  if (storageDriver === "supabase") {
    try {
      const response = await fetch(url);

      if (!response.ok) return null;

      return Buffer.from(await response.arrayBuffer());
    } catch {
      return null;
    }
  }

  const parsed = assetPath(url);
  if (!parsed) return null;

  if (isLocalStorage) {
    if (!fs.existsSync(parsed.path)) return null;

    return fsp.readFile(parsed.path);
  }

  return null;
}