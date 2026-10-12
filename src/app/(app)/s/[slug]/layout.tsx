import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, FileText, FolderTree, Target } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Spread } from "@/components/shell/spread";
import { SectionSettings } from "@/components/sections/section-settings";
import { NewSectionPopover } from "@/components/sections/new-subsection";
import { NewDocButton } from "@/components/docs/new-doc-button";
import { DocList } from "@/components/docs/doc-list";
import { getChildSections, getSectionBySlug, getSectionDocuments, getSectionFiles } from "@/server/queries/sections";
import { FileDrop, UploadButton } from "@/components/files/file-uploader";
import { FileList } from "@/components/files/file-list";
import { storageMode } from "@/server/storage";
import { requireUserId } from "@/server/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { PageHeader } from "@/components/ui/page-header";
import { pageBody } from "@/components/ui/page-body";
import { getProjectOptions, getSections, getSettings } from "@/server/queries/core";
import { getProjects } from "@/server/queries/dashboard";
import { ProjectCard } from "@/components/projects/project-card";
import { NewProject } from "@/components/projects/new-project";
import { getBacklog, getSectionUpcoming } from "@/server/queries/tasks";
import { PlannerProvider } from "@/components/planner/planner-context";
import { SectionTasks } from "@/components/sections/section-tasks";
import { localDate } from "@/lib/time";
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

  const settings = await getSettings();
  const today = localDate(new Date(), settings.timezone);
  const userId = await requireUserId();
  const [children_, docs, options, all, backlog, upcoming, projectOptions, projects, sectionFiles] = await Promise.all([
    getChildSections(section.id),
    getSectionDocuments(section.id),
    listSectionOptions(),
    getSections(),
    getBacklog(section.id),
    getSectionUpcoming(section.id, today),
    getProjectOptions(),
    getProjects(section.id),
    getSectionFiles(section.id),
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
    <div className={pageBody} style={dyeVars(section.color)}>
      <div className="flex flex-col gap-1 pt-2">
        {trail.length > 0 && (
          <nav aria-label="Bovenliggende secties" className="flex flex-wrap items-center gap-1 px-1 text-sm text-ink-3">
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
        <PageHeader
          title={section.name}
          info="section"
          subtitle={section.archivedAt ? "Gearchiveerd" : undefined}
          lead={
            <span
              aria-hidden
              className="mt-1 h-7 w-2 shrink-0 rounded-[3px] bg-[var(--dye)] ring-1 ring-[color-mix(in_oklch,var(--dye-deep)_25%,transparent)]"
            />
          }
          actions={
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
          }
        />
      </div>

      <SectionTasks sectionId={section.id} />

      <Card
        icon={Target}
        title="Projecten"
        count={projects.length}
        action={<NewProject sections={[]} defaultSectionId={section.id} />}
      >
        {projects.length > 0 ? (
          <div className="divide-y divide-rule">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} today={today} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Target} text="Een doel met eenheden, bv. 200 lessen. Afgevinkte taken tellen mee." />
        )}
      </Card>

      <FileDrop sectionId={section.id} mode={storageMode} prefix={`u/${userId}/${section.id}/`}>
        <Card
          icon={FileText}
          title="Documenten"
          count={docs.length + sectionFiles.length}
          action={
            <>
              <UploadButton />
              <NewDocButton sectionId={section.id} slug={section.slug} />
            </>
          }
        >
          {docs.length === 0 && sectionFiles.length === 0 ? (
            <EmptyState
              icon={FileText}
              text={
                <>
                  Notities in markdown en bestanden zoals pdf&apos;s.
                  <span className="max-lg:hidden"> Sleep bestanden hierheen.</span>
                </>
              }
              action={<NewDocButton sectionId={section.id} slug={section.slug} variant="button" />}
            />
          ) : (
            <>
              <DocList
                slug={section.slug}
                docs={docs.map((d) => ({
                  id: d.id,
                  title: d.title,
                  pinned: d.pinned,
                  updated: format(d.updatedAt, "d MMM", { locale: nl }),
                }))}
              />
              <FileList
                slug={section.slug}
                files={sectionFiles.map((f) => ({
                  id: f.id,
                  name: f.name,
                  contentType: f.contentType,
                  size: f.size,
                  added: format(f.createdAt, "d MMM", { locale: nl }),
                }))}
              />
            </>
          )}
        </Card>
      </FileDrop>

      <Card icon={FolderTree} title="Subsecties" count={children_.length} action={<NewSectionPopover parentId={section.id} />}>
        {children_.length > 0 ? (
          <ul className="divide-y divide-rule">
            {children_.map((c) => (
              <ListRow
                key={c.id}
                href={`/s/${c.slug}`}
                style={dyeVars(c.color)}
                lead={<span className="h-6 w-1.5 shrink-0 rounded-[3px] bg-[var(--dye)]" />}
                title={c.name}
              />
            ))}
          </ul>
        ) : (
          <EmptyState icon={FolderTree} text="Splits een grote sectie op, bv. Studie in vakken." />
        )}
      </Card>
    </div>
  );

  return (
    <PlannerProvider
      initialTasks={[...backlog, ...upcoming]}
      sections={all.map(({ id, name, slug, color }) => ({ id, name, slug, color }))}
      projects={projectOptions}
      today={today}
      initialDay={today}
      scope={{ sectionId: section.id }}
    >
      <Spread left={left} right={children} leftLabel={section.name} rightLabel="Overzicht" rightLabelOnPattern="Document" rightPathPattern="/(d|f)/" />
    </PlannerProvider>
  );
}
