import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { z } from "zod";
import { db } from "@/db/client";
import { files } from "@/db/schema";
import { requireUserId } from "@/server/auth";
import { canShowInline, fileKind, formatBytes } from "@/lib/files";
import { FileActions, FileTitle } from "@/components/files/file-actions";
import { FileIcon } from "@/components/files/file-icon";
import { InfoButton } from "@/components/help/info-button";

type Params = Promise<{ slug: string; fileId: string }>;

async function load(fileId: string) {
  if (!z.uuid().safeParse(fileId).success) return null;
  const userId = await requireUserId();
  const [file] = await db
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)));
  return file ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const file = await load((await params).fileId);
  return { title: file?.name ?? "Bestand" };
}

export default async function FilePage({ params }: { params: Params }) {
  const { slug, fileId } = await params;
  const file = await load(fileId);
  if (!file) notFound();
  const src = `/api/files/${file.id}`;
  const kind = fileKind(file.contentType, file.name);
  const inline = canShowInline(file.contentType);

  return (
    <article className="m-3 flex min-h-[calc(100%-1.5rem)] flex-col rounded-xl border border-rule bg-card px-4 pb-5 pt-4 shadow-[0_1px_2px_oklch(0.2_0.02_258/0.04)] sm:mx-4 lg:m-6 lg:h-[calc(100%-3rem)] lg:px-8 lg:pt-6">
      <header className="flex flex-wrap items-start gap-3 pb-4">
        <div className="min-w-0 flex-1">
          <FileTitle id={file.id} name={file.name} />
          <p className="figures mt-0.5 text-sm text-ink-3">
            {formatBytes(file.size)} · {format(file.createdAt, "d MMMM yyyy", { locale: nl })}
          </p>
        </div>
        <InfoButton topic="file" align="end" />
        <FileActions id={file.id} slug={decodeURIComponent(slug)} />
      </header>

      <div className="min-h-0 flex-1">
        {inline && kind === "pdf" && (
          <iframe src={src} title={file.name} className="h-[calc(100dvh-12rem)] w-full rounded-sm border border-rule bg-paper" />
        )}
        {inline && kind === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={file.name} className="max-h-[calc(100dvh-12rem)] max-w-full rounded-sm border border-rule object-contain" />
        )}
        {inline && kind === "video" && <video src={src} controls className="max-h-[calc(100dvh-12rem)] w-full rounded-sm bg-ink" />}
        {inline && kind === "audio" && <audio src={src} controls className="w-full" />}
        {inline && kind === "text" && (
          <iframe src={src} title={file.name} className="h-[calc(100dvh-12rem)] w-full rounded-sm border border-rule bg-paper" />
        )}
        {!inline && (
          <div className="grid h-64 place-items-center rounded-sm border border-dashed border-rule-strong">
            <div className="flex flex-col items-center gap-2 text-center">
              <FileIcon contentType={file.contentType} name={file.name} className="size-8 text-ink-3" />
              <p className="text-sm text-ink-2">Geen voorbeeld voor dit type. Download het om het te openen.</p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
