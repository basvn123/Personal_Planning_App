"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Pin } from "lucide-react";
import { cx } from "@/lib/cx";

export type DocListItem = { id: string; title: string; pinned: boolean; updated: string };

export function DocList({ slug, docs }: { slug: string; docs: DocListItem[] }) {
  const pathname = usePathname();
  return (
    <ul>
      {docs.map((d) => {
        const href = `/s/${slug}/d/${d.id}`;
        const active = pathname === href;
        return (
          <li key={d.id} className="border-t border-rule first:border-t-0">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "group -mx-2 flex min-h-11 items-center gap-2.5 rounded-md px-2 transition-colors",
                active ? "bg-ribbon-wash text-ink" : "text-ink hover:bg-paper-3/70",
              )}
            >
              {d.pinned ? (
                <Pin className="size-4 shrink-0 text-ribbon-ink" strokeWidth={2} aria-label="Vastgezet" />
              ) : (
                <FileText className="size-4 shrink-0 text-ink-3" strokeWidth={1.75} />
              )}
              <span className={cx("min-w-0 flex-1 truncate", !d.title && "text-ink-3")}>{d.title || "Zonder titel"}</span>
              <span className="figures shrink-0 text-xs text-ink-3">{d.updated}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
