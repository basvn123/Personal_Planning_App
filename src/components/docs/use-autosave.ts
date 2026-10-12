"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveDocument } from "@/server/actions/documents";

export type SaveState = "saved" | "dirty" | "saving" | "error";

type Patch = { title?: string; contentMd?: string };

/**
 * Debounced document saving. Edits are merged into one pending patch,
 * sent 800 ms after the last keystroke, retried on failure, and flushed
 * with sendBeacon when the tab is hidden or closed.
 */
export function useAutosave(docId: string, delay = 800) {
  const pending = useRef<Patch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef(false);
  const [state, setState] = useState<SaveState>("saved");

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inflight.current) {
      timer.current = setTimeout(flush, 200);
      return;
    }
    const patch = pending.current;
    if (patch.title === undefined && patch.contentMd === undefined) return;
    pending.current = {};
    inflight.current = true;
    setState("saving");
    try {
      await saveDocument(docId, patch);
      inflight.current = false;
      const more = pending.current.title !== undefined || pending.current.contentMd !== undefined;
      setState(more ? "dirty" : "saved");
      if (more) timer.current = setTimeout(flush, delay);
    } catch {
      inflight.current = false;
      // Put the failed patch back underneath anything typed since.
      pending.current = { ...patch, ...pending.current };
      setState("error");
      timer.current = setTimeout(flush, 3000);
    }
  }, [docId, delay]);

  const queue = useCallback(
    (patch: Patch) => {
      pending.current = { ...pending.current, ...patch };
      setState("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [flush, delay],
  );

  useEffect(() => {
    function beacon() {
      const patch = pending.current;
      if (patch.title === undefined && patch.contentMd === undefined) return;
      const ok = navigator.sendBeacon(
        `/api/docs/${docId}`,
        new Blob([JSON.stringify(patch)], { type: "application/json" }),
      );
      if (ok) pending.current = {};
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") beacon();
    }
    function onBeforeUnload(e: BeforeUnloadEvent) {
      beacon();
      if (pending.current.title !== undefined || pending.current.contentMd !== undefined) e.preventDefault();
    }
    window.addEventListener("pagehide", beacon);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", beacon);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibility);
      // Leaving the page inside the app: save what is left.
      void flush();
    };
  }, [docId, flush]);

  return { state, queue, flush };
}
