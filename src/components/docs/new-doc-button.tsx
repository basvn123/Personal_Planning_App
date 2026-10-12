"use client";

import { cardActionClass } from "@/components/ui/card";
import { emptyActionClass } from "@/components/ui/empty-state";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Plus } from "lucide-react";
import { createDocument } from "@/server/actions/documents";

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
        className={emptyActionClass}
      >
        <Plus className="size-4" strokeWidth={2} />
        Nieuw document
      </button>
    );
  return (
    <button
      type="button"
      onClick={create}
      disabled={pending}
      aria-label="Nieuw document"
      title="Nieuw document"
      className={cardActionClass}
    >
      <Plus className="size-5 lg:size-4" strokeWidth={2.25} />
    </button>
  );
}
