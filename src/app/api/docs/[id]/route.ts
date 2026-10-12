import { NextResponse } from "next/server";
import { saveDocumentContent } from "@/server/documents";

/** Receives the final save from navigator.sendBeacon when a page is closed. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    await saveDocumentContent(id, body);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Invalid document save" }, { status: 400 });
  }
}
