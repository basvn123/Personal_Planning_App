import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { Heatmap } from "@/components/charts/heatmap";
import { getSectionBySlug, getSectionDocuments } from "@/server/queries/sections";
import { getSettings } from "@/server/queries/core";
import { getSectionDailySeries } from "@/server/queries/dashboard";
import { formatDuration, localDate, shiftDay, weekDays } from "@/lib/time";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const section = await getSectionBySlug(decodeURIComponent((await params).slug));
  return { title: section?.name ?? "Section" };
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
    <div className="flex min-h-full flex-col px-5 pb-12 pt-6 lg:px-10">
      <dl className="grid grid-cols-3 border-y border-rule-strong">
        {[
          ["This week", thisWeek],
          ["Last 4 weeks", last4],
          ["16 weeks", total],
        ].map(([label, secs]) => (
          <div key={label as string} className="flex flex-col gap-1 border-r border-rule py-3 pl-3 first:pl-0 last:border-r-0">
            <dt className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{label}</dt>
            <dd className="figures text-lg font-medium text-ink">{formatDuration(secs as number)}</dd>
          </div>
        ))}
      </dl>

      <section aria-label="Activity" className="mt-8">
        <h2 className="mb-3 border-b border-rule-strong pb-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">Activity</h2>
        <Heatmap days={series} today={today} />
      </section>

      {docs.length > 0 && (
        <section aria-label="Recent documents" className="mt-8">
          <h2 className="border-b border-rule-strong pb-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">Recently edited</h2>
          <ul>
            {docs.slice(0, 5).map((d) => (
              <li key={d.id} className="border-b border-rule">
                <Link href={`/s/${section.slug}/d/${d.id}`} className="-mx-2 flex h-10 items-center gap-2.5 rounded-xs px-2 text-base hover:bg-paper-3/70">
                  <FileText className="size-3.5 shrink-0 text-ink-3" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1 truncate">{d.title || "Untitled"}</span>
                  <span className="figures text-xs text-ink-3">{format(d.updatedAt, "d MMM")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
