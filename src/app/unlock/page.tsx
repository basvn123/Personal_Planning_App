import type { Metadata } from "next";
import { UnlockForm } from "./unlock-form";

export const metadata: Metadata = { title: "Aanmelden" };

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center bg-cloth-2 p-4">
      <div className="paper relative flex w-full max-w-[22rem] flex-col items-center gap-8 rounded-lg px-8 pb-6 pt-12 shadow-lift">
        <span
          aria-hidden
          className="absolute -top-1 right-10 h-14 w-3.5 bg-ribbon [clip-path:polygon(0_0,100%_0,100%_100%,50%_82%,0_100%)]"
        />
        <BookMark />
        <UnlockForm next={next ?? "/"} />
      </div>
    </main>
  );
}

function BookMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-9 text-cloth" aria-hidden>
      <rect x="3" y="5" width="26" height="22" rx="2.5" fill="currentColor" />
      <rect x="15.25" y="5" width="1.5" height="22" fill="var(--cloth-2)" />
      <path d="M21 5h4v9l-2-1.6L21 14z" fill="var(--ribbon)" />
    </svg>
  );
}
