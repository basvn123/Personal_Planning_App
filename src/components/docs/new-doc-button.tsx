"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Plus } from "lucide-react";
import { createDocument } from "@/server/actions/documents";
import { cx } from "@/lib/cx";

export function NewDocButton({ sectionId, slug, variant = "icon" }: { sectionId: string; slug: string; variant?: "icon" | "button" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  function create() {
    start(async () => {
      const id = await createDocument(sectionId);
      router.push(`/s/${slug}/d/${id}?new=1`);
    });
  }
  if (variant === "button")
    return (
      <button
        type="button"
        onClick={create}
        disabled={pending}
        className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-cloth px-3 text-sm font-medium text-cloth-ink transition-colors hover:bg-cloth-3 disabled:opacity-50"
      >
        <Plus className="size-4" strokeWidth={2} />
        New document
      </button>
    );
  return (
    <button
      type="button"
      onClick={create}
      disabled={pending}
      aria-label="New document"
      title="New document"
      className={cx(
        "grid size-7 place-items-center rounded-sm text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink disabled:opacity-40",
      )}
    >
      <Plus className="size-4" strokeWidth={1.75} />
    </button>
  );
}
