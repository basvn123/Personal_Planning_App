"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button, inputClass } from "@/components/ui/button";
import { archiveSection, deleteSection, updateSection } from "@/server/actions/sections";
import { DyePicker } from "./dye-picker";

type Option = { id: string; name: string; parentId: string | null };

export function SectionSettings({
  section,
  options,
}: {
  section: { id: string; name: string; color: string; parentId: string | null; archived: boolean };
  options: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(section.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Possible parents: anything that is not this section or nested inside it.
  const blocked = new Set([section.id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const o of options) {
      if (o.parentId && blocked.has(o.parentId) && !blocked.has(o.id)) {
        blocked.add(o.id);
        grew = true;
      }
    }
  }
  const parents = options.filter((o) => !blocked.has(o.id));

  function run(fn: () => Promise<unknown>) {
    setError(null);
    start(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  function rename() {
    if (!name.trim() || name.trim() === section.name) return;
    run(async () => {
      const { slug } = await updateSection(section.id, { name });
      router.replace(`/s/${slug}`);
    });
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setConfirmDelete(false);
      }}
    >
      <PopoverTrigger
        aria-label="Section settings"
        className="grid size-8 place-items-center rounded-sm text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
      >
        <Settings2 className="size-4" strokeWidth={1.75} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              rename();
            }}
          >
            <Label>Name</Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={rename}
              maxLength={80}
              className={inputClass}
            />
          </form>
          <div>
            <Label>Color</Label>
            <DyePicker value={section.color} onChange={(color) => run(() => updateSection(section.id, { color }))} />
          </div>
          <div>
            <Label>Inside</Label>
            <select
              value={section.parentId ?? ""}
              onChange={(e) => run(() => updateSection(section.id, { parentId: e.target.value || null }))}
              className={inputClass}
            >
              <option value="">Top level</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex items-center gap-2 border-t border-rule pt-3">
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await archiveSection(section.id, !section.archived);
                  setOpen(false);
                  if (!section.archived) router.push("/week");
                })
              }
            >
              {section.archived ? "Restore" : "Archive"}
            </Button>
            {confirmDelete ? (
              <Button
                variant="danger"
                className="ml-auto"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    await deleteSection(section.id);
                    router.push("/week");
                  })
                }
              >
                Delete for good
              </Button>
            ) : (
              <Button variant="ghost" className="ml-auto text-danger hover:text-danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
          </div>
          {confirmDelete && (
            <p className="-mt-2 text-xs text-ink-2">
              Removes its tasks, time entries and any documents that live only here.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{children}</span>;
}
