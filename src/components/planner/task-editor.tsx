"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Archive, FileText, Link2, Trash2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button, IconButton, inputClass } from "@/components/ui/button";
import { linkDocumentTask } from "@/server/actions/documents";
import { listSectionDocuments } from "@/server/actions/tasks";
import type { PlannerTask } from "@/server/queries/tasks";
import { usePlanner } from "./planner-context";
import { cx } from "@/lib/cx";
import { formatMinutes } from "@/lib/time";

const DURATIONS = [15, 30, 45, 60, 90, 120, 180];

/** Edit form for one task. Every field saves on change or blur. */
export function TaskEditor({ task, onClose }: { task: PlannerTask; onClose: () => void }) {
  const { sections, patch, remove } = usePlanner();
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notesMd);
  const [docs, setDocs] = useState(task.docs);
  const [docOptions, setDocOptions] = useState<{ id: string; title: string }[] | null>(null);
  const temp = task.id.startsWith("temp-");

  useEffect(() => setDocs(task.docs), [task.docs]);

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
    <div className="flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-3">
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
        aria-label="Task title"
        className="w-full resize-none bg-transparent text-md font-medium leading-snug text-ink outline-none [field-sizing:content]"
      />

      <div className="grid grid-cols-2 gap-2">
        <Field label="Section" className="col-span-2">
          <select
            value={task.section.id}
            disabled={temp}
            aria-label="Section"
            onChange={(e) => patch(task.id, { sectionId: e.target.value })}
            className={inputClass}
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Day">
          <input
            type="date"
            value={task.plannedDate ?? ""}
            disabled={temp}
            aria-label="Day"
            onChange={(e) => e.target.value && patch(task.id, { plannedDate: e.target.value })}
            className={cx(inputClass, "figures")}
          />
        </Field>
        <Field label="Start">
          <input
            type="time"
            value={task.plannedStart ?? ""}
            disabled={temp}
            aria-label="Start time"
            onChange={(e) => patch(task.id, { plannedStart: e.target.value || null })}
            className={cx(inputClass, "figures")}
          />
        </Field>
        <Field label="Duration" className="col-span-2">
          <div className="flex flex-wrap gap-1">
            {DURATIONS.map((m) => (
              <button
                key={m}
                type="button"
                disabled={temp}
                aria-pressed={task.plannedMinutes === m}
                onClick={() => patch(task.id, { plannedMinutes: task.plannedMinutes === m ? null : m })}
                className={cx(
                  "figures h-7 rounded-xs px-2 text-xs transition-colors",
                  task.plannedMinutes === m ? "bg-cloth text-cloth-ink" : "bg-paper-3 text-ink-2 hover:text-ink",
                )}
              >
                {formatMinutes(m)}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          value={notes}
          disabled={temp}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== task.notesMd && patch(task.id, { notesMd: notes })}
          rows={3}
          placeholder="Markdown"
          aria-label="Notes"
          className={cx(inputClass, "h-auto resize-y py-2 leading-snug")}
        />
      </Field>

      <Field label="Documents">
        <div className="flex flex-col">
          {docs.map((d) => (
            <div key={d.id} className="group flex h-8 items-center gap-2 border-b border-rule text-sm">
              <FileText className="size-3.5 shrink-0 text-ink-3" strokeWidth={1.75} />
              <Link href={`/s/${d.slug}/d/${d.id}`} className="min-w-0 flex-1 truncate hover:underline" onClick={onClose}>
                {d.title || "Untitled"}
              </Link>
              <IconButton label="Unlink document" className="size-6 opacity-60 group-hover:opacity-100" onClick={() => toggleDoc(d)}>
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
              Link document
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-1.5">
              {!docOptions ? (
                <p className="px-2 py-3 text-sm text-ink-3">Loading</p>
              ) : docOptions.length === 0 ? (
                <p className="px-2 py-3 text-sm text-ink-3">No documents in {task.section.name}.</p>
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
                        <span className="min-w-0 flex-1 truncate">{d.title || "Untitled"}</span>
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

      <div className="flex items-center gap-1 border-t border-rule pt-2.5">
        <Button
          variant="ghost"
          disabled={temp || task.plannedDate === null}
          onClick={() => {
            patch(task.id, { plannedDate: null, plannedStart: null });
            onClose();
          }}
        >
          <Archive className="size-3.5" strokeWidth={1.75} />
          To backlog
        </Button>
        <Button
          variant="ghost"
          className="ml-auto text-danger hover:text-danger"
          disabled={temp}
          onClick={() => {
            remove(task.id);
            onClose();
          }}
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
          Delete
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
