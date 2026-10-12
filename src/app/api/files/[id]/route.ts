import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { files } from "@/db/schema";
import { canShowInline } from "@/lib/files";
import { sessionUserId } from "@/server/auth";
import { openStored } from "@/server/storage";

/** Streams a file to its owner only. Unsafe types always download instead of rendering. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [file] = await db
    .select()
    .from(files)
    .where(and(eq(files.id, id), eq(files.userId, userId)));
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stream = await openStored(file.storageKey);
  if (!stream) return NextResponse.json({ error: "File missing" }, { status: 404 });

  const wantsDownload = new URL(request.url).searchParams.get("download") === "1";
  const inline = !wantsDownload && canShowInline(file.contentType);
  const encoded = encodeURIComponent(file.name);
  return new NextResponse(stream, {
    headers: {
      "content-type": inline ? file.contentType : "application/octet-stream",
      "content-length": String(file.size),
      "content-disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encoded}`,
      "x-content-type-options": "nosniff",
      "content-security-policy": "sandbox",
      "cache-control": "private, max-age=3600",
    },
  });
}
