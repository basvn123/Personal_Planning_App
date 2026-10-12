"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { upload, uploadPresigned } from "@vercel/blob/client";
import { Upload } from "lucide-react";
import { registerBlobFile } from "@/server/actions/files";
import { MAX_FILE_BYTES, formatBytes, safeFileName } from "@/lib/files";
import { cx } from "@/lib/cx";
import { cardActionClass } from "@/components/ui/card";

type Job = { key: string; name: string; state: "busy" | "done" | "error"; note?: string };

/** Upload button plus a drop zone around `children`. Files land in this section. */
export function FileDrop({
  sectionId,
  mode,
  prefix,
  children,
}: {
  sectionId: string;
  mode: "blob" | "blob-oidc" | "local";
  prefix: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [over, setOver] = useState(false);

  async function send(file: File) {
    const key = crypto.randomUUID();
    const set = (patch: Partial<Job>) => setJobs((js) => js.map((j) => (j.key === key ? { ...j, ...patch } : j)));
    setJobs((js) => [...js, { key, name: file.name, state: "busy" }]);
    if (file.size > MAX_FILE_BYTES) {
      set({ state: "error", note: `te groot (max ${formatBytes(MAX_FILE_BYTES)})` });
      return;
    }
    try {
      if (mode === "blob") {
        const blob = await upload(prefix + safeFileName(file.name), file, {
          access: "private",
          handleUploadUrl: "/api/files/upload",
          clientPayload: JSON.stringify({ sectionId }),
          contentType: file.type || undefined,
        });
        await registerBlobFile({ sectionId, pathname: blob.pathname, name: file.name });
      } else if (mode === "blob-oidc") {
        // A presigned URL covers one exact path, so the path itself carries the unique part.
        const blob = await uploadPresigned(`${prefix}${key.slice(0, 8)}-${safeFileName(file.name)}`, file, {
          access: "private",
          handleUploadUrl: "/api/files/upload",
          clientPayload: JSON.stringify({ sectionId }),
          contentType: file.type || undefined,
        });
        await registerBlobFile({ sectionId, pathname: blob.pathname, name: file.name });
      } else {
        const form = new FormData();
        form.set("sectionId", sectionId);
        form.set("file", file);
        const res = await fetch("/api/files/upload", { method: "POST", body: form });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "mislukt");
      }
      set({ state: "done" });
      router.refresh();
      setTimeout(() => setJobs((js) => js.filter((j) => j.key !== key)), 2500);
    } catch (e) {
      const msg = e instanceof Error && /Blob/.test(e.message) ? e.message : "uploaden mislukt";
      set({ state: "error", note: msg });
    }
  }

  function take(list: FileList | null) {
    if (!list) return;
    for (const f of Array.from(list)) void send(f);
  }

  return (
    <div
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files);
      }}
      className={cx("relative rounded-sm transition-shadow", over && "shadow-[0_0_0_2px_var(--ribbon-2)]")}
    >
      {children}
      {over && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-sm bg-ribbon-wash/85 text-sm font-medium text-ink">
          Loslaten om te uploaden
        </div>
      )}
      {jobs.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1" aria-live="polite">
          {jobs.map((j) => (
            <li key={j.key} className="flex items-center gap-2 text-xs">
              <span
                className={cx(
                  "size-1.5 shrink-0 rounded-full",
                  j.state === "busy" && "animate-pulse bg-ribbon-2",
                  j.state === "done" && "bg-[var(--dye-moss-deep)]",
                  j.state === "error" && "bg-danger",
                )}
              />
              <span className="min-w-0 truncate text-ink-2">{j.name}</span>
              <span className={cx("shrink-0", j.state === "error" ? "text-danger" : "text-ink-3")}>
                {j.state === "busy" ? "bezig" : j.state === "done" ? "klaar" : j.note}
              </span>
            </li>
          ))}
        </ul>
      )}
      <UploadInput onFiles={take} />
    </div>
  );
}

function UploadInput({ onFiles }: { onFiles: (f: FileList | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <input
      ref={ref}
      id="file-upload-input"
      type="file"
      multiple
      className="sr-only"
      tabIndex={-1}
      onChange={(e) => {
        onFiles(e.target.files);
        e.target.value = "";
      }}
    />
  );
}

/** Opens the file picker of the nearest FileDrop. */
export function UploadButton() {
  return (
    <label
      htmlFor="file-upload-input"
      title="Bestand uploaden"
      className={cx(cardActionClass, "cursor-pointer")}
    >
      <Upload className="size-5 lg:size-4" strokeWidth={2} />
      <span className="sr-only">Bestand uploaden</span>
    </label>
  );
}
