import { issueSignedToken } from "@vercel/blob";
import {
  handleUpload,
  handleUploadPresigned,
  type HandleUploadBody,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { files } from "@/db/schema";
import { MAX_FILE_BYTES, safeFileName } from "@/lib/files";
import { sessionUserId } from "@/server/auth";
import { ownSections } from "@/server/own";
import { localKey, saveLocal, storageMode } from "@/server/storage";

/**
 * Blob modes: hands the browser a short-lived token (or, with OIDC, a presigned
 * URL) to upload straight to a private Vercel Blob path under its own account.
 * Local mode: receives the file itself and keeps it in a folder on disk.
 */
export async function POST(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  if (storageMode === "blob-oidc") {
    try {
      const body = (await request.json()) as HandleUploadPresignedBody;
      const result = await handleUploadPresigned({
        body,
        request,
        getSignedToken: async (pathname, clientPayload) => {
          const { sectionId } = JSON.parse(clientPayload ?? "{}") as { sectionId?: string };
          if (!sectionId) throw new Error("No section");
          await ownSections(userId, sectionId);
          if (!pathname.startsWith(`u/${userId}/${sectionId}/`)) throw new Error("Wrong path");
          // Scoped to this one path, write only, for ten minutes.
          const token = await issueSignedToken({
            pathname,
            operations: ["put"],
            maximumSizeInBytes: MAX_FILE_BYTES,
            validUntil: Date.now() + 10 * 60_000,
          });
          return { token, urlOptions: { maximumSizeInBytes: MAX_FILE_BYTES } };
        },
      });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Upload refused" }, { status: 400 });
    }
  }

  if (storageMode === "blob") {
    try {
      const body = (await request.json()) as HandleUploadBody;
      const result = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          const { sectionId } = JSON.parse(clientPayload ?? "{}") as { sectionId?: string };
          if (!sectionId) throw new Error("No section");
          await ownSections(userId, sectionId);
          if (!pathname.startsWith(`u/${userId}/${sectionId}/`)) throw new Error("Wrong path");
          return { maximumSizeInBytes: MAX_FILE_BYTES, addRandomSuffix: true };
        },
      });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Upload refused" }, { status: 400 });
    }
  }

  // Vercel's disk is temporary: without a Blob store, uploads would vanish.
  if (process.env.VERCEL) {
    return NextResponse.json({ error: "Koppel eerst een Vercel Blob-opslag (Storage, Blob)." }, { status: 503 });
  }

  try {
    const form = await request.formData();
    const sectionId = String(form.get("sectionId") ?? "");
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("No file");
    if (file.size > MAX_FILE_BYTES) throw new Error("Too large");
    await ownSections(userId, sectionId);
    const name = safeFileName(file.name);
    const key = localKey(userId, sectionId, name);
    await saveLocal(key, await file.arrayBuffer());
    const [row] = await db
      .insert(files)
      .values({
        userId,
        sectionId,
        name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        storageKey: `local:${key}`,
        url: "",
      })
      .returning({ id: files.id });
    return NextResponse.json({ id: row.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 });
  }
}
