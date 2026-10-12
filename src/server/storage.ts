import "server-only";
import { createReadStream } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { del, get } from "@vercel/blob";

/**
 * How files are stored and uploaded:
 * - "blob": Vercel Blob with a read-write token (stores connected the older way).
 * - "blob-oidc": Vercel Blob through the project's OIDC login. Newer stores only
 *   inject BLOB_STORE_ID, so the browser uploads to a presigned URL instead.
 * - "local": a folder on disk, for development.
 */
export type StorageMode = "blob" | "blob-oidc" | "local";

export const storageMode: StorageMode = process.env.BLOB_READ_WRITE_TOKEN
  ? "blob"
  : process.env.BLOB_STORE_ID
    ? "blob-oidc"
    : "local";

const LOCAL_ROOT = resolve(process.cwd(), ".uploads");

function localPath(key: string) {
  const p = resolve(LOCAL_ROOT, key);
  if (!p.startsWith(LOCAL_ROOT + "/")) throw new Error("Bad storage key");
  return p;
}

export async function saveLocal(key: string, data: ArrayBuffer) {
  const p = localPath(key);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, Buffer.from(data));
}

/** Returns a web stream for a stored file, or null when it is gone. */
export async function openStored(storageKey: string): Promise<ReadableStream<Uint8Array> | null> {
  if (storageKey.startsWith("blob:")) {
    const res = await get(storageKey.slice(5), { access: "private" });
    return res && res.statusCode === 200 ? res.stream : null;
  }
  if (storageKey.startsWith("local:")) {
    try {
      return Readable.toWeb(createReadStream(localPath(storageKey.slice(6)))) as ReadableStream<Uint8Array>;
    } catch {
      return null;
    }
  }
  return null;
}

export async function removeStored(storageKey: string) {
  if (storageKey.startsWith("blob:")) await del(storageKey.slice(5));
  else if (storageKey.startsWith("local:")) await rm(localPath(storageKey.slice(6)), { force: true });
}

export function localKey(userId: string, sectionId: string, name: string) {
  return join("u", userId, sectionId, `${crypto.randomUUID()}-${name}`);
}
