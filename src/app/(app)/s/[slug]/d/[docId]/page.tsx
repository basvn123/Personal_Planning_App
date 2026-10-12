import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { DocEditor } from "@/components/docs/doc-editor";
import { getAllTagNames, getDocument } from "@/server/queries/sections";
import { getSections } from "@/server/queries/core";

type Params = Promise<{ slug: string; docId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { docId } = await params;
  if (!z.uuid().safeParse(docId).success) return {};
  const doc = await getDocument(docId);
  return { title: doc?.title || "Untitled" };
}

export default async function DocPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ new?: string }>;
}) {
  const [{ slug, docId }, { new: isNew }] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(docId).success) notFound();
  const [doc, sections, tags] = await Promise.all([getDocument(docId), getSections(), getAllTagNames()]);
  if (!doc) notFound();

  return (
    <DocEditor
      key={doc.id}
      doc={{
        id: doc.id,
        title: doc.title,
        contentMd: doc.contentMd,
        pinned: doc.pinned,
        sections: doc.sections,
        tags: doc.tags,
      }}
      currentSlug={decodeURIComponent(slug)}
      allSections={sections.map(({ id, name, slug, color }) => ({ id, name, slug, color }))}
      allTags={tags}
      isNew={isNew === "1"}
    />
  );
}
