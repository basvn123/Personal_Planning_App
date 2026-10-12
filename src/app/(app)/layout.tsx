import { CommandPalette } from "@/components/shell/command-palette";
import { ForeEdge, TabStrip } from "@/components/shell/fore-edge";
import { Spine, SpineBar } from "@/components/shell/spine";
import { getDocIndex, getSections } from "@/server/queries/core";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [all, docs] = await Promise.all([getSections(), getDocIndex()]);
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
    <div className="flex h-dvh flex-col bg-cloth lg:flex-row">
      <Spine />
      <TabStrip sections={tabs} activeRoot={activeRoot} />
      <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden lg:my-3 lg:rounded-r-[6px] lg:rounded-l-[3px] lg:shadow-[0_2px_0_var(--paper-3),0_4px_0_var(--rule),0_10px_30px_-12px_oklch(0_0_0/0.5)]">
        {children}
      </main>
      <ForeEdge sections={tabs} activeRoot={activeRoot} />
      <SpineBar />
      <CommandPalette sections={sections} docs={docs} />
    </div>
  );
}
