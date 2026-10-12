"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FileText, Link2, Repeat, Trash2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button, IconButton, inputClass } from "@/components/ui/button";
import { linkDocumentTask } from "@/server/actions/documents";
import { listSectionDocuments } from "@/server/actions/tasks";
import type { PlannerTask } from "@/server/queries/tasks";
import { usePlanner } from "./planner-context";
import { DayChips, DurationChips, SectionChips, TimeField } from "./task-fields";
import { cx } from "@/lib/cx";

/** Edit form for one task. Every field saves on change or blur. */
export function TaskEditor({ task, onClose }: { task: PlannerTask; onClose: () => void }) {
  const { sections, projects, today, patch, remove, removeSeries } = usePlanner();
  const [confirmSeries, setConfirmSeries] = useState(false);
  const sectionProjects = projects.filter((pr) => pr.sectionId === task.section.id);
  const project = projects.find((pr) => pr.id === task.projectId);
  const [units, setUnits] = useState(task.units === null ? "" : String(task.units));
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notesMd);
  const [docs, setDocs] = useState(task.docs);
  const [docOptions, setDocOptions] = useState<{ id: string; title: string }[] | null>(null);
  const temp = task.id.startsWith("temp-");

  useEffect(() => setDocs(task.docs), [task.docs]);

  // The time wheel fires on every turn; save once it settles.
  const [time, setTime] = useState(task.plannedStart?.slice(0, 5) ?? "");
  const patchRef = useRef(patch);
  useEffect(() => {
    patchRef.current = patch;
  });
  useEffect(() => setTime(task.plannedStart?.slice(0, 5) ?? ""), [task.plannedStart]);
  useEffect(() => {
    const current = task.plannedStart?.slice(0, 5) ?? "";
    if (time === current) return;
    const t = setTimeout(() => patchRef.current(task.id, { plannedStart: time || null }), 600);
    return () => clearTimeout(t);
  }, [time, task.id, task.plannedStart]);
  useEffect(() => setUnits(task.units === null ? "" : String(task.units)), [task.units]);

  function saveTitle() {
    const v = title.trim();
    if (v && v !== task.title) patch(task.id, { title: v });
    else setTitle(task.title);
  }

  async function loadDocs() {
    if (docOptions) return;
    setDocOptions(await listSectionDocuments(task.section.id));
  }

  async function toggleDoc(doc: { id: string; title: string }) {
    const linked = docs.some((d) => d.id === doc.id);
    const next = linked ? docs.filter((d) => d.id !== doc.id) : [...docs, { ...doc, slug: task.section.slug }];
    setDocs(next);
    try {
      await linkDocumentTask(doc.id, task.id, !linked);
    } catch {
      setDocs(docs);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3 lg:w-[min(22rem,calc(100vw-1.5rem))]">
      <textarea
        value={title}
        rows={1}
        disabled={temp}
        onChange={(e) => setTitle(e.target.value.replace(/\n/g, " "))}
        onBlur={saveTitle}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            saveTitle();
            (e.target as HTMLTextAreaElement).blur();
          }
        }}
        aria-label="Taak"
        className="w-full resize-none bg-transparent text-md font-medium leading-snug text-ink outline-none [field-sizing:content]"
      />

      <Field label="Wanneer">
        <DayChips
          value={task.plannedDate}
          today={today}
          disabled={temp}
          onChange={(d) => patch(task.id, d === null ? { plannedDate: null, plannedStart: null } : { plannedDate: d })}
        />
      </Field>

      {task.plannedDate !== null && (
        <>
          <Field label="Duur">
            <DurationChips
              value={task.plannedMinutes}
              disabled={temp}
              onChange={(m) => patch(task.id, { plannedMinutes: m })}
            />
          </Field>
          <Field label="Om">
            <TimeField value={time} disabled={temp} onChange={setTime} />
          </Field>
        </>
      )}

      <Field label="Sectie">
        <SectionChips
          sections={sections}
          value={task.section.id}
          disabled={temp}
          onChange={(id) => id !== task.section.id && patch(task.id, { sectionId: id })}
        />
      </Field>

      {(sectionProjects.length > 0 || task.projectId) && (
        <div className="grid grid-cols-[1fr_5.5rem] gap-2">
          <Field label="Telt mee voor">
            <select
              value={task.projectId ?? ""}
              disabled={temp}
              aria-label="Project"
              onChange={(e) => patch(task.id, { projectId: e.target.value || null, ...(e.target.value && !task.units ? { units: 1 } : {}) })}
              className={inputClass}
            >
              <option value="">Geen project</option>
              {sectionProjects.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={project?.unitLabel ?? "Eenheden"}>
            <input
              type="number"
              min={0}
              step="any"
              value={units}
              disabled={temp || !task.projectId}
              aria-label="Eenheden"
              onChange={(e) => setUnits(e.target.value)}
              onBlur={() => {
                const n = Number(units);
                if (units === "" ? task.units !== null : n > 0 && n !== task.units) patch(task.id, { units: units === "" ? null : n });
              }}
              className={cx(inputClass, "figures")}
            />
          </Field>
        </div>
      )}

      <Field label="Notities">
        <textarea
          value={notes}
          disabled={temp}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== task.notesMd && patch(task.id, { notesMd: notes })}
          rows={3}
          placeholder="Markdown"
          aria-label="Notities"
          className={cx(inputClass, "h-auto resize-y py-2 leading-snug")}
        />
      </Field>

      <Field label="Documenten">
        <div className="flex flex-col">
          {docs.map((d) => (
            <div key={d.id} className="group flex h-8 items-center gap-2 border-b border-rule text-sm">
              <FileText className="size-3.5 shrink-0 text-ink-3" strokeWidth={1.75} />
              <Link href={`/s/${d.slug}/d/${d.id}`} className="min-w-0 flex-1 truncate hover:underline" onClick={onClose}>
                {d.title || "Zonder titel"}
              </Link>
              <IconButton label="Document loskoppelen" className="size-6 opacity-60 group-hover:opacity-100" onClick={() => toggleDoc(d)}>
                <X className="size-3" strokeWidth={2} />
              </IconButton>
            </div>
          ))}
          <Popover onOpenChange={(o) => o && loadDocs()}>
            <PopoverTrigger
              disabled={temp}
              className="mt-1 inline-flex h-7 items-center gap-1.5 self-start rounded-xs px-1.5 text-xs text-ink-2 hover:bg-paper-3 hover:text-ink"
            >
              <Link2 className="size-3.5" strokeWidth={1.75} />
              Document koppelen
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-1.5">
              {!docOptions ? (
                <p className="px-2 py-3 text-sm text-ink-3">Laden</p>
              ) : docOptions.length === 0 ? (
                <p className="px-2 py-3 text-sm text-ink-3">Geen documenten in {task.section.name}.</p>
              ) : (
                <ul className="max-h-60 overflow-y-auto">
                  {docOptions.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        role="menuitemcheckbox"
                        aria-checked={docs.some((x) => x.id === d.id)}
                        onClick={() => toggleDoc(d)}
                        className="flex h-8 w-full items-center gap-2 rounded-xs px-2 text-left text-sm hover:bg-paper-3"
                      >
                        <span className="min-w-0 flex-1 truncate">{d.title || "Zonder titel"}</span>
                        {docs.some((x) => x.id === d.id) && <span className="size-1.5 rounded-full bg-cloth" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </Field>

      {task.scheduleId && (
        <div className="flex flex-col gap-1.5 border-t border-rule pt-2.5">
          <span className="flex items-center gap-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">
            <Repeat className="size-3" strokeWidth={1.75} />
            Uit vaste planning
          </span>
          <div className="flex flex-wrap items-center gap-1">
            <Link
              href={`/schedules?id=${task.scheduleId}`}
              onClick={onClose}
              className="inline-flex h-8 items-center rounded-sm px-3 text-sm font-medium text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink max-lg:h-10"
            >
              Reeks bewerken
            </Link>
            {confirmSeries ? (
              <Button
                variant="danger"
                className="ml-auto max-lg:h-10"
                onClick={() => {
                  removeSeries(task.scheduleId!, task.id);
                  onClose();
                }}
              >
                Hele reeks verwijderen
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="ml-auto text-danger hover:text-danger max-lg:h-10"
                onClick={() => setConfirmSeries(true)}
              >
                Reeks verwijderen
              </Button>
            )}
          </div>
          {confirmSeries && (
            <p className="text-xs text-ink-3">
              Haalt alle komende keren uit je planning. Afgeronde en gelogde keren blijven staan.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 border-t border-rule pt-2.5">
        <Button
          variant="ghost"
          className="ml-auto text-danger hover:text-danger max-lg:h-10"
          disabled={temp}
          onClick={() => {
            remove(task.id);
            onClose();
          }}
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
          {task.scheduleId ? "Alleen deze" : "Verwijderen"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className={cx("flex flex-col gap-1", className)}>
      <span className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{label}</span>
      {children}
    </div>
  );
}
