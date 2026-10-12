import { CommandPalette } from "@/components/shell/command-palette";
import { ForeEdge, TabStrip } from "@/components/shell/fore-edge";
import { Spine, SpineBar } from "@/components/shell/spine";
import { getSections } from "@/server/queries/core";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sections = (await getSections()).map(({ id, name, slug, color }) => ({
    id,
    name,
    slug,
    color,
  }));

  return (
    <div className="flex h-dvh flex-col bg-cloth lg:flex-row">
      <Spine />
      <TabStrip sections={sections} />
      <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden lg:my-3 lg:rounded-r-[6px] lg:rounded-l-[3px] lg:shadow-[0_2px_0_var(--paper-3),0_4px_0_var(--rule),0_10px_30px_-12px_oklch(0_0_0/0.5)]">
        {children}
      </main>
      <ForeEdge sections={sections} />
      <SpineBar />
      <CommandPalette sections={sections} />
    </div>
  );
}
