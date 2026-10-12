import { CommandPalette } from "@/components/shell/command-palette";
import { ForeEdge, TabStrip } from "@/components/shell/fore-edge";
import { Spine, SpineBar } from "@/components/shell/spine";
import { getDocIndex, getSections, getSettings } from "@/server/queries/core";
import { localDate } from "@/lib/time";
import { getRunningTimer } from "@/server/queries/time";
import { TimerProvider } from "@/components/timer/timer-context";
import { QuickAddSheet } from "@/components/planner/quick-add-sheet";
import { Toaster } from "@/components/shell/toaster";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [all, docs, settings, running] = await Promise.all([
    getSections(),
    getDocIndex(),
    getSettings(),
    getRunningTimer(),
  ]);
  const byId = new Map(all.map((s) => [s.id, s]));
  // Tabs show top-level sections; a nested section lights up its root tab.
  const activeRoot: Record<string, string> = {};
  for (const s of all) {
    let root = s;
    const seen = new Set<string>();
    while (root.parentId && byId.has(root.parentId) && !seen.has(root.id)) {
      seen.add(root.id);
      root = byId.get(root.parentId)!;
    }
    activeRoot[s.slug] = root.slug;
  }
  const pick = ({ id, name, slug, color }: (typeof all)[number]) => ({ id, name, slug, color });
  const tabs = all.filter((s) => !s.parentId || !byId.has(s.parentId)).map(pick);
  const sections = all.map(pick);

  return (
    <TimerProvider initial={running}>
    {/* Pinned to the screen edges; app-shell is the full screen even where iOS reports it short. */}
    <div className="app-shell fixed inset-x-0 top-0 flex flex-col bg-cloth lg:static lg:h-dvh lg:flex-row">
      <Spine />
      <TabStrip sections={tabs} activeRoot={activeRoot} />
      <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-canvas lg:my-3 lg:rounded-2xl lg:shadow-[0_10px_30px_-12px_oklch(0_0_0/0.45)]">
        {children}
      </main>
      <ForeEdge sections={tabs} activeRoot={activeRoot} />
      <SpineBar />
      <CommandPalette sections={sections} docs={docs} today={localDate(new Date(), settings.timezone)} />
      <Suspense>
        <QuickAddSheet sections={sections} today={localDate(new Date(), settings.timezone)} weekStart={settings.weekStart === 0 ? 0 : 1} />
      </Suspense>
      <Toaster />
    </div>
    </TimerProvider>
  );
}
