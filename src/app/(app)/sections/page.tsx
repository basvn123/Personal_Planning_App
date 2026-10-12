import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { nl } from "date-fns/locale";
import { FileText, ListTodo, Paperclip } from "lucide-react";
import { Spread } from "@/components/shell/spread";
import { NewSectionInline } from "@/components/sections/new-section-inline";
import { InfoButton } from "@/components/help/info-button";
import { FileIcon } from "@/components/files/file-icon";
import { getSettings } from "@/server/queries/core";
import { getRecentLibrary, getSectionSummaries, type SectionSummary } from "@/server/queries/overview";
import { formatDuration, localDate, weekDays } from "@/lib/time";
import { dyeVars } from "@/lib/dyes";
import { cx } from "@/lib/cx";

export const metadata: Metadata = { title: "Secties" };

export default async function SectionsPage() {
  const settings = await getSettings();
  const today = localDate(new Date(), settings.timezone);
  const week = weekDays(today, settings.weekStart === 0 ? 0 : 1);
  const [summaries, library] = await Promise.all([getSectionSummaries(week[0], week[6], today), getRecentLibrary(40)]);

  // Parents first, children indented under them, keeping the user's order.
  const ids = new Set(summaries.map((s) => s.id));
  const roots = summaries.filter((s) => !s.parentId || !ids.has(s.parentId));
  const childrenOf = (id: string) => summaries.filter((s) => s.parentId === id);
  const ordered: { s: SectionSummary; depth: number }[] = [];
  const walk = (s: SectionSummary, depth: number) => {
    ordered.push({ s, depth });
    for (const c of childrenOf(s.id)) walk(c, depth + 1);
  };
  roots.forEach((r) => walk(r, 0));

  const left = (
    <div className="flex min-h-full flex-col px-5 pb-12 pt-6 lg:px-8">
      <h1 className="flex items-center gap-1.5 text-xl font-semibold tracking-[-0.02em]">
        Secties
        <InfoButton topic="sections" />
      </h1>
      <div className="mt-6 grid grid-cols-[1fr_repeat(3,3rem)_3.5rem] items-end gap-x-2 border-b border-rule-strong pb-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">
        <span>Naam</span>
        <span className="text-right" title="Open to-do's">To-do</span>
        <span className="text-right" title="Documenten en bestanden">Docs</span>
        <span className="text-right" title="Gepland vanaf vandaag">Gepland</span>
        <span className="text-right" title="Gelogd deze week">Week</span>
      </div>
      <ul>
        {ordered.map(({ s, depth }) => (
          <li key={s.id} className="border-b border-rule">
            <Link
              href={`/s/${s.slug}`}
              style={dyeVars(s.color)}
              className="-mx-2 grid grid-cols-[1fr_repeat(3,3rem)_3.5rem] items-center gap-x-2 rounded-xs px-2 py-2.5 transition-colors hover:bg-paper-3/70"
            >
              <span className="flex min-w-0 items-center gap-2.5" style={{ paddingLeft: depth * 16 }}>
                <span
                  className={cx(
                    "shrink-0 rounded-[2px] bg-[var(--dye)] ring-1 ring-[color-mix(in_oklch,var(--dye-deep)_30%,transparent)]",
                    depth ? "h-3 w-1.5" : "h-4 w-2",
                  )}
                />
                <span className={cx("truncate", depth ? "text-base text-ink-2" : "text-md text-ink")}>{s.name}</span>
              </span>
              <Count value={s.openTodos} />
              <Count value={s.docs + s.files} />
              <Count value={s.planned} />
              <span className={cx("figures text-right text-sm", s.weekSeconds ? "text-ink-2" : "text-ink-3")}>
                {formatDuration(s.weekSeconds)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <NewSectionInline />
      </div>
    </div>
  );

  const right = (
    <div className="flex min-h-full flex-col px-5 pb-12 pt-6 lg:px-10">
      <h2 className="border-b border-rule-strong pb-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">
        Laatst bewerkt
      </h2>
      {library.length === 0 ? (
        <p className="py-5 text-sm text-ink-3">Nog geen documenten of bestanden.</p>
      ) : (
        <ul>
          {library.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="border-b border-rule">
              <Link
                href={`/s/${item.section.slug}/${item.kind === "doc" ? "d" : "f"}/${item.id}`}
                style={dyeVars(item.section.color)}
                className="-mx-2 flex h-11 items-center gap-2.5 rounded-xs px-2 transition-colors hover:bg-paper-3/70"
              >
                {item.kind === "doc" ? (
                  <FileText className="size-3.5 shrink-0 text-ink-3" strokeWidth={1.75} />
                ) : (
                  <FileIcon contentType={item.contentType ?? ""} name={item.title} className="size-3.5 shrink-0 text-ink-3" />
                )}
                <span className="min-w-0 flex-1 truncate text-base">{item.title || "Zonder titel"}</span>
                <span className="hidden shrink-0 items-center gap-1.5 text-xs text-ink-3 sm:flex">
                  <span className="size-2 rounded-[2px] bg-[var(--dye)]" />
                  {item.section.name}
                </span>
                <span className="w-24 shrink-0 text-right text-xs text-ink-3">
                  {formatDistanceToNowStrict(item.updatedAt, { locale: nl, addSuffix: true })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1"><ListTodo className="size-3" strokeWidth={1.75} /> to-do = nog niet ingepland</span>
        <span className="inline-flex items-center gap-1"><Paperclip className="size-3" strokeWidth={1.75} /> docs = documenten en bestanden</span>
      </p>
    </div>
  );

  return <Spread left={left} right={right} leftLabel="Secties" rightLabel="Recent" />;
}

function Count({ value }: { value: number }) {
  return <span className={cx("figures text-right text-sm", value ? "text-ink-2" : "text-ink-3/60")}>{value}</span>;
}
