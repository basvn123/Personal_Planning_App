import type { Metadata } from "next";
import { CalendarClock, FileText, History, Inbox, LibraryBig, Paperclip } from "lucide-react";
import { Spread } from "@/components/shell/spread";
import { NewSectionInline } from "@/components/sections/new-section-inline";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { PageHeader } from "@/components/ui/page-header";
import { pageBody } from "@/components/ui/page-body";
import { RecentList } from "@/components/library/recent-list";
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
    <div className={pageBody}>
      <PageHeader title="Secties" info="sections" subtitle="Elke sectie is een werkplek: to-do, documenten, tijd en projecten." className="pt-2" />
      <Card icon={LibraryBig} title="Al je secties" count={summaries.length} action={<NewSectionInline compact />}>
        {ordered.length === 0 ? (
          <EmptyState icon={LibraryBig} text="Nog geen secties. Maak er een voor elk deel van je leven, bv. Werk, Studie of Sport." />
        ) : (
          <ul className="divide-y divide-rule">
            {ordered.map(({ s, depth }) => (
              <ListRow
                key={s.id}
                href={`/s/${s.slug}`}
                style={dyeVars(s.color)}
                indent={depth}
                lead={
                  <span
                    className={cx(
                      "shrink-0 rounded-[3px] bg-[var(--dye)] ring-1 ring-[color-mix(in_oklch,var(--dye-deep)_30%,transparent)]",
                      depth ? "h-6 w-1.5" : "h-8 w-2",
                    )}
                  />
                }
                title={s.name}
                sub={
                  <span className="figures inline-flex flex-wrap gap-x-3">
                    <span className="inline-flex items-center gap-1">
                      <Inbox className="size-3" strokeWidth={1.75} />
                      {s.openTodos} to-do
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="size-3" strokeWidth={1.75} />
                      {s.planned} gepland
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Paperclip className="size-3" strokeWidth={1.75} />
                      {s.docs + s.files}
                    </span>
                  </span>
                }
                meta={
                  <span className={cx("figures text-sm", s.weekSeconds ? "font-medium text-ink-2" : "text-ink-3")} title="Gelogd deze week">
                    {formatDuration(s.weekSeconds)}
                  </span>
                }
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );

  const right = (
    <div className={pageBody}>
      <Card icon={History} title="Laatst bewerkt" count={library.length}>
        {library.length === 0 ? (
          <EmptyState icon={FileText} text="Nog geen documenten of bestanden. Open een sectie en maak er een." />
        ) : (
          <RecentList
            items={library.map((item) => ({
              kind: item.kind,
              id: item.id,
              title: item.title,
              updatedAt: item.updatedAt,
              contentType: item.contentType,
              section: item.section,
            }))}
          />
        )}
      </Card>
    </div>
  );

  return <Spread left={left} right={right} leftLabel="Secties" rightLabel="Recent" />;
}
