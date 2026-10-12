import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChartColumn, Grid3x3, History, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatStrip } from "@/components/ui/stat-strip";
import { pageBody } from "@/components/ui/page-body";
import { RecentList } from "@/components/library/recent-list";
import { Heatmap } from "@/components/charts/heatmap";
import { getSectionBySlug, getSectionDocuments } from "@/server/queries/sections";
import { getSettings } from "@/server/queries/core";
import { getSectionDailySeries } from "@/server/queries/dashboard";
import { formatDuration, localDate, shiftDay, weekDays } from "@/lib/time";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const section = await getSectionBySlug(decodeURIComponent((await params).slug));
  return { title: section?.name ?? "Sectie" };
}

/** Facing page when no document is open: the section's rhythm and recent pages. */
export default async function SectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const section = await getSectionBySlug(decodeURIComponent((await params).slug));
  if (!section) notFound();
  const settings = await getSettings();
  const today = localDate(new Date(), settings.timezone);
  const week = weekDays(today, settings.weekStart === 0 ? 0 : 1);
  const heatFrom = weekDays(shiftDay(today, -7 * 15), 1)[0];
  const [series, docs] = await Promise.all([
    getSectionDailySeries(section.id, heatFrom, weekDays(today, 1)[6]),
    getSectionDocuments(section.id),
  ]);
  const sum = (from: string, to: string) => series.filter((d) => d.day >= from && d.day <= to).reduce((s, d) => s + d.seconds, 0);
  const thisWeek = sum(week[0], week[6]);
  const last4 = sum(shiftDay(today, -27), today);
  const total = series.reduce((s, d) => s + d.seconds, 0);

  return (
    <div className={pageBody}>
      <Card icon={ChartColumn} title="Overzicht" meta="gelogde tijd">
        <StatStrip
          items={[
            { label: "Deze week", value: formatDuration(thisWeek) },
            { label: "Laatste 4 weken", value: formatDuration(last4) },
            { label: "16 weken", value: formatDuration(total) },
          ]}
        />
      </Card>

      <Card icon={Grid3x3} title="Activiteit" meta="hoe donkerder, hoe meer tijd">
        {total > 0 ? (
          <div className="pt-1">
            <Heatmap days={series} today={today} />
          </div>
        ) : (
          <EmptyState icon={Timer} text="Nog geen tijd gelogd in deze sectie. Start een timer op een van haar taken." />
        )}
      </Card>

      {docs.length > 0 && (
        <Card icon={History} title="Laatst bewerkt">
          <RecentList
            showSection={false}
            items={docs.slice(0, 5).map((d) => ({
              kind: "doc" as const,
              id: d.id,
              title: d.title,
              updatedAt: d.updatedAt,
              section: { name: section.name, slug: section.slug, color: section.color },
            }))}
          />
        </Card>
      )}
    </div>
  );
}
