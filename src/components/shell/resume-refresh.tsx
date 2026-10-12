"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const STALE_MS = 60_000;

/**
 * A home-screen app has no reload button. When it comes back to the front
 * after a while, fetch fresh data so the planner never shows yesterday.
 */
export function ResumeRefresh() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/unlock")) return;
    let hiddenAt = 0;
    function onVisibility() {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > STALE_MS) router.refresh();
    }
    // iOS restores a frozen app from its back-forward cache instead of reloading it.
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) router.refresh();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [router, pathname]);

  return null;
}
