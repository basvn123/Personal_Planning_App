import { NextResponse } from "next/server";
import { sessionUserId } from "@/server/auth";
import { saveDocumentContent } from "@/server/documents";

/** Receives the final save from navigator.sendBeacon when a page is closed. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  try {
    await saveDocumentContent(userId, id, await request.json());
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Invalid document save" }, { status: 400 });
  }
}
