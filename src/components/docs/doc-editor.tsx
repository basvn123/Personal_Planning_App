"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { BookOpen, Check, FolderInput, PenLine, Pin, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button, IconButton } from "@/components/ui/button";
import {
  deleteDocument,
  linkDocumentSection,
  setDocumentPinned,
  setDocumentTags,
} from "@/server/actions/documents";
import { dyeVars } from "@/lib/dyes";
import { cx } from "@/lib/cx";
import { MarkdownView } from "./markdown-view";
import { TagInput } from "./tag-input";
import { useAutosave, type SaveState } from "./use-autosave";
import { InfoButton } from "@/components/help/info-button";

const MarkdownEditor = dynamic(() => import("./markdown-editor").then((m) => m.MarkdownEditor), {
  ssr: false,
  loading: () => <div className="h-40" />,
});

type SectionRef = { id: string; name: string; slug: string; color: string };

export function DocEditor({
  doc,
  currentSlug,
  allSections,
  allTags,
  isNew,
}: {
  doc: { id: string; title: string; contentMd: string; pinned: boolean; sections: SectionRef[]; tags: string[] };
  currentSlug: string;
  allSections: SectionRef[];
  allTags: string[];
  isNew: boolean;
}) {
  const router = useRouter();
  const { state, queue, flush } = useAutosave(doc.id);
  const [title, setTitle] = useState(doc.title);
  const [content, setContent] = useState(doc.contentMd);
  const [mode, setMode] = useState<"write" | "read">("write");
  const [tags, setTags] = useState(doc.tags);
  const [pinned, setPinned] = useState(doc.pinned);
  const [linked, setLinked] = useState(() => new Set(doc.sections.map((s) => s.id)));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, start] = useTransition();
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("doc-mode");
      if (!isNew && (saved === "read" || saved === "write")) setMode(saved);
    } catch {}
  }, [isNew]);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  const onContent = useCallback(
    (value: string) => {
      setContent(value);
      queue({ contentMd: value });
    },
    [queue],
  );
  const saveNow = useCallback(() => void flush(), [flush]);

  function switchMode(next: "write" | "read") {
    setMode(next);
    try {
      localStorage.setItem("doc-mode", next);
    } catch {}
  }

  function toggleSection(id: string) {
    const on = !linked.has(id);
    if (!on && linked.size <= 1) return;
    const next = new Set(linked);
    if (on) next.add(id);
    else next.delete(id);
    setLinked(next);
    start(async () => {
      try {
        await linkDocumentSection(doc.id, id, on);
      } catch {
        setLinked(linked);
      }
    });
  }

  return (
    <article className="flex min-h-full flex-col px-5 pt-5 lg:px-10 lg:pt-6">
      <div className="flex flex-wrap items-center gap-1 pb-4">
        <div className="mr-auto flex flex-wrap items-center gap-1">
          {allSections
            .filter((s) => linked.has(s.id))
            .map((s) => (
              <span
                key={s.id}
                style={dyeVars(s.color)}
                className={cx(
                  "inline-flex h-6 items-center gap-1.5 rounded-xs px-2 text-xs",
                  s.slug === currentSlug ? "bg-[var(--dye)] text-ink" : "bg-paper-3 text-ink-2",
                )}
              >
                {s.slug !== currentSlug && <span className="size-1.5 rounded-full bg-[var(--dye-deep)]" />}
                {s.name}
              </span>
            ))}
          <Popover>
            <PopoverTrigger asChild>
              <IconButton label="Secties" className="size-6">
                <FolderInput className="size-3.5" strokeWidth={1.75} />
              </IconButton>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-60 p-1.5">
              <ul className="max-h-72 overflow-y-auto">
                {allSections.map((s) => {
                  const on = linked.has(s.id);
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        role="menuitemcheckbox"
                        aria-checked={on}
                        onClick={() => toggleSection(s.id)}
                        disabled={on && linked.size <= 1}
                        style={dyeVars(s.color)}
                        className="flex h-8 w-full items-center gap-2.5 rounded-xs px-2 text-left text-sm text-ink hover:bg-paper-3 disabled:opacity-50"
                      >
                        <span className="size-2.5 rounded-[2px] bg-[var(--dye)]" />
                        <span className="flex-1 truncate">{s.name}</span>
                        {on && <Check className="size-3.5 text-ink-2" strokeWidth={2} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </PopoverContent>
          </Popover>
        </div>

        {/* The tools stay together; on a narrow page they wrap as one row under the sections. */}
        <div className="ml-auto flex items-center gap-1">
          <InfoButton topic="document" align="end" />
          <SaveIndicator state={state} />
          <div role="group" aria-label="Weergave" className="ml-1 flex rounded-sm bg-paper-3 p-0.5">
            <ModeButton active={mode === "write"} onClick={() => switchMode("write")} label="Schrijven">
              <PenLine className="size-3.5" strokeWidth={1.75} />
            </ModeButton>
            <ModeButton active={mode === "read"} onClick={() => switchMode("read")} label="Lezen">
              <BookOpen className="size-3.5" strokeWidth={1.75} />
            </ModeButton>
          </div>
          <IconButton
            label={pinned ? "Losmaken" : "Vastzetten"}
            aria-pressed={pinned}
            onClick={() => {
              setPinned(!pinned);
              start(() => setDocumentPinned(doc.id, !pinned));
            }}
            className={cx(pinned && "text-ribbon-ink")}
          >
            <Pin className="size-4" strokeWidth={1.75} fill={pinned ? "currentColor" : "none"} />
          </IconButton>
          <Popover open={confirmDelete} onOpenChange={setConfirmDelete}>
            <PopoverTrigger asChild>
              <IconButton label="Document verwijderen">
                <Trash2 className="size-4" strokeWidth={1.75} />
              </IconButton>
            </PopoverTrigger>
            <PopoverContent align="end" className="flex w-56 flex-col gap-2">
              <p className="text-sm">Dit document verwijderen?</p>
              <Button
                variant="danger"
                onClick={() =>
                  start(async () => {
                    await deleteDocument(doc.id);
                    router.push(`/s/${currentSlug}`);
                  })
                }
              >
                Verwijderen
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <textarea
        ref={titleRef}
        value={title}
        rows={1}
        autoFocus={isNew}
        onChange={(e) => {
          const v = e.target.value.replace(/\n/g, " ");
          setTitle(v);
          queue({ title: v });
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
          if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            saveNow();
          }
        }}
        placeholder="Zonder titel"
        aria-label="Titel"
        maxLength={300}
        className="w-full resize-none overflow-hidden bg-transparent text-2xl font-semibold tracking-[-0.025em] text-ink outline-none placeholder:text-ink-3 [text-wrap:balance]"
      />
      <div className="mb-5 mt-2 border-b border-rule pb-3">
        <TagInput
          value={tags}
          suggestions={allTags}
          onChange={(next) => {
            setTags(next);
            start(() => setDocumentTags(doc.id, next));
          }}
        />
      </div>

      <div className="max-w-[68ch] flex-1">
        {mode === "write" ? (
          <MarkdownEditor value={content} onChange={onContent} onSaveShortcut={saveNow} autoFocus={false} />
        ) : (
          <div className="pb-24">
            <MarkdownView source={content} />
          </div>
        )}
      </div>
    </article>
  );
}

function ModeButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cx(
        "grid h-7 w-8 place-items-center rounded-xs transition-colors duration-150",
        active ? "bg-paper text-ink shadow-[0_1px_2px_oklch(0.2_0.02_258/0.12)]" : "text-ink-3 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const label = { saved: "Opgeslagen", dirty: "Bezig", saving: "Opslaan", error: "Niet opgeslagen, opnieuw proberen" }[state];
  return (
    <span
      role="status"
      aria-live="polite"
      className={cx(
        "inline-flex h-6 items-center gap-1.5 px-1.5 text-xs transition-colors",
        state === "error" ? "text-danger" : "text-ink-3",
      )}
    >
      <span
        aria-hidden
        className={cx(
          "size-1.5 rounded-full transition-colors duration-300",
          state === "saved" && "bg-[var(--dye-moss-deep)]",
          (state === "dirty" || state === "saving") && "bg-ribbon-2",
          state === "error" && "bg-danger",
        )}
      />
      {label}
    </span>
  );
}
