"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatBytes } from "@/lib/files";
import { cx } from "@/lib/cx";
import { FileIcon } from "./file-icon";

export type FileListItem = { id: string; name: string; contentType: string; size: number; added: string };

export function FileList({ slug, files }: { slug: string; files: FileListItem[] }) {
  const pathname = usePathname();
  return (
    <ul>
      {files.map((f) => {
        const href = `/s/${slug}/f/${f.id}`;
        const active = pathname === href;
        return (
          <li key={f.id} className="border-b border-rule">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "-mx-2 flex h-10 items-center gap-2 rounded-xs px-2 transition-colors",
                active ? "bg-ribbon-wash text-ink" : "text-ink hover:bg-paper-3/70",
              )}
            >
              <FileIcon contentType={f.contentType} name={f.name} className="size-3.5 shrink-0 text-ink-3" />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="figures shrink-0 text-xs text-ink-3">{formatBytes(f.size)}</span>
              <span className="figures w-12 shrink-0 text-right text-xs text-ink-3">{f.added}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
