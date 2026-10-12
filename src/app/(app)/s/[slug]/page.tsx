import type { Metadata } from "next";
import { getSectionBySlug } from "@/server/queries/sections";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const section = await getSectionBySlug(decodeURIComponent((await params).slug));
  return { title: section?.name ?? "Section" };
}

export default function SectionPage() {
  return (
    <div className="grid min-h-full place-items-center p-8">
      <p className="text-sm text-ink-3">Pick a document, or start a new one.</p>
    </div>
  );
}
