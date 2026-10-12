import { formatDistanceToNowStrict } from "date-fns";
import { nl } from "date-fns/locale";
import { FileText } from "lucide-react";
import { FileIcon } from "@/components/files/file-icon";
import { ListRow } from "@/components/ui/list-row";
import { dyeVars } from "@/lib/dyes";

export type RecentItem = {
  kind: "doc" | "file";
  id: string;
  title: string;
  updatedAt: Date;
  contentType?: string | null;
  section: { name: string; slug: string; color: string };
};

/** Recently touched documents and files, newest first. `showSection` when they come from several sections. */
export function RecentList({ items, showSection = true }: { items: RecentItem[]; showSection?: boolean }) {
  return (
    <ul className="divide-y divide-rule">
      {items.map((item) => (
        <ListRow
          key={`${item.kind}-${item.id}`}
          href={`/s/${item.section.slug}/${item.kind === "doc" ? "d" : "f"}/${item.id}`}
          style={dyeVars(item.section.color)}
          lead={
            item.kind === "doc" ? (
              <FileText className="size-4 shrink-0 text-ink-3" strokeWidth={1.75} />
            ) : (
              <FileIcon contentType={item.contentType ?? ""} name={item.title} className="size-4 shrink-0 text-ink-3" />
            )
          }
          title={item.title || "Zonder titel"}
          sub={
            <span className="inline-flex items-center gap-1.5">
              {showSection && (
                <>
                  <span className="size-2 rounded-[2px] bg-[var(--dye)]" />
                  {item.section.name}
                  <span aria-hidden>·</span>
                </>
              )}
              {formatDistanceToNowStrict(item.updatedAt, { locale: nl, addSuffix: true })}
            </span>
          }
        />
      ))}
    </ul>
  );
}
