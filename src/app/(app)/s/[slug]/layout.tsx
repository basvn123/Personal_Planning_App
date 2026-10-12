import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Spread } from "@/components/shell/spread";
import { SectionSettings } from "@/components/sections/section-settings";
import { NewSectionPopover } from "@/components/sections/new-subsection";
import { NewDocButton } from "@/components/docs/new-doc-button";
import { DocList } from "@/components/docs/doc-list";
import { getChildSections, getSectionBySlug, getSectionDocuments } from "@/server/queries/sections";
import { getSections } from "@/server/queries/core";
import { listSectionOptions } from "@/server/actions/sections";
import { dyeVars } from "@/lib/dyes";

export default async function SectionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const section = await getSectionBySlug(decodeURIComponent(slug));
  if (!section) notFound();

  const [children_, docs, options, all] = await Promise.all([
    getChildSections(section.id),
    getSectionDocuments(section.id),
    listSectionOptions(),
    getSections(),
  ]);

  // Breadcrumb of ancestors.
  const byId = new Map(all.map((s) => [s.id, s]));
  const trail: { name: string; slug: string }[] = [];
  let cursor = section.parentId ? byId.get(section.parentId) : undefined;
  while (cursor && trail.length < 8) {
    trail.unshift({ name: cursor.name, slug: cursor.slug });
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }

  const left = (
    <div className="flex min-h-full flex-col px-5 pb-10 pt-6 lg:px-8" style={dyeVars(section.color)}>
      {trail.length > 0 && (
        <nav aria-label="Parent sections" className="mb-2 flex flex-wrap items-center gap-1 text-sm text-ink-3">
          {trail.map((t) => (
            <span key={t.slug} className="flex items-center gap-1">
              <Link href={`/s/${t.slug}`} className="hover:text-ink">
                {t.name}
              </Link>
              <ChevronRight className="size-3" strokeWidth={2} />
            </span>
          ))}
        </nav>
      )}
      <header className="flex items-start gap-3">
        <span aria-hidden className="mt-1 h-6 w-1.5 shrink-0 rounded-[1px] bg-[var(--dye)] ring-1 ring-[color-mix(in_oklch,var(--dye-deep)_25%,transparent)]" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]">{section.name}</h1>
          {section.archivedAt && <p className="text-sm text-ink-3">Archived</p>}
        </div>
        <SectionSettings
          section={{
            id: section.id,
            name: section.name,
            color: section.color,
            parentId: section.parentId,
            archived: Boolean(section.archivedAt),
          }}
          options={options}
        />
      </header>

      <Block
        title="Documents"
        action={<NewDocButton sectionId={section.id} slug={section.slug} />}
      >
        {docs.length === 0 ? (
          <div className="py-5">
            <NewDocButton sectionId={section.id} slug={section.slug} variant="button" />
          </div>
        ) : (
          <DocList
            slug={section.slug}
            docs={docs.map((d) => ({
              id: d.id,
              title: d.title,
              pinned: d.pinned,
              updated: format(d.updatedAt, "d MMM"),
            }))}
          />
        )}
      </Block>

      <Block title="Subsections" action={<NewSectionPopover parentId={section.id} />}>
        {children_.length > 0 && (
          <ul>
            {children_.map((c) => (
              <li key={c.id} className="border-b border-rule">
                <Link
                  href={`/s/${c.slug}`}
                  style={dyeVars(c.color)}
                  className="-mx-2 flex h-10 items-center gap-3 rounded-xs px-2 transition-colors hover:bg-paper-3/70"
                >
                  <span className="size-2.5 rounded-[2px] bg-[var(--dye)]" />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Block>
    </div>
  );

  return (
    <Spread left={left} right={children} leftLabel={section.name} rightLabel="Page" rightPathPattern="/d/" />
  );
}

function Block({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="mt-8">
      <div className="flex h-8 items-center justify-between border-b border-rule-strong">
        <h2 className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
