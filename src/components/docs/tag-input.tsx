"use client";

import { X } from "lucide-react";
import { useId, useState } from "react";

export function TagInput({
  value,
  suggestions,
  onChange,
}: {
  value: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const listId = useId();

  function add(raw: string) {
    const name = raw.trim().replace(/^#/, "");
    setDraft("");
    if (!name || value.some((v) => v.toLowerCase() === name.toLowerCase())) return;
    onChange([...value, name]);
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex h-6 items-center gap-1 rounded-xs bg-paper-3 pl-2 pr-1 text-xs text-ink-2"
        >
          #{tag}
          <button
            type="button"
            aria-label={`${tag} verwijderen`}
            onClick={() => onChange(value.filter((v) => v !== tag))}
            className="grid size-4 place-items-center rounded-[2px] text-ink-3 hover:bg-rule hover:text-ink"
          >
            <X className="size-3" strokeWidth={2} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        list={listId}
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(",")) add(v.slice(0, -1));
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft && add(draft)}
        placeholder={value.length ? "" : "Label toevoegen"}
        aria-label="Label toevoegen"
        className="h-6 w-24 min-w-0 bg-transparent text-xs text-ink outline-none placeholder:text-ink-3"
      />
      <datalist id={listId}>
        {suggestions
          .filter((s) => !value.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  );
}
