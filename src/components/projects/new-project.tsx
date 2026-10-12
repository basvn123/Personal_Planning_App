"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button, inputClass } from "@/components/ui/button";
import { createProject } from "@/server/actions/projects";
import { cx } from "@/lib/cx";

export function NewProject({ sections, defaultSectionId }: { sections: { id: string; name: string }[]; defaultSectionId?: string }) {
  const [open, setOpen] = useState(false);
  const [sectionId, setSectionId] = useState(defaultSectionId ?? sections[0]?.id ?? "");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, run] = useTransition();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="New project"
        title="New project"
        className="grid size-7 place-items-center rounded-sm text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
      >
        <Plus className="size-4" strokeWidth={1.75} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const t = Number(target);
            if (!name.trim() || !(t > 0) || !unit.trim()) return setError("Name, target and unit are needed.");
            setError(null);
            run(async () => {
              try {
                await createProject({ sectionId, name, targetUnits: t, unitLabel: unit, dueDate: due || null });
                setName("");
                setTarget("");
                setUnit("");
                setDue("");
                setOpen(false);
              } catch {
                setError("Could not create the project.");
              }
            });
          }}
        >
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Goal, e.g. Italian course" aria-label="Name" className={inputClass} />
          {!defaultSectionId && (
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} aria-label="Section" className={inputClass}>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          <div className="grid grid-cols-2 gap-2">
            <input type="number" min={1} step="any" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="200" aria-label="Target" className={cx(inputClass, "figures")} />
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="lessons" aria-label="Unit" className={inputClass} />
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">Due (optional)</span>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={cx(inputClass, "figures")} />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" variant="primary" disabled={pending}>
            Create
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
