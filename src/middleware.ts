import { NextResponse, type NextRequest } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const ok = Boolean(await readSession(request.cookies.get(SESSION_COOKIE)?.value));
  if (ok) return NextResponse.next();

  const url = request.nextUrl.clone();
  const next = request.nextUrl.pathname + request.nextUrl.search;
  url.pathname = "/unlock";
  url.search = next && next !== "/" ? `?next=${encodeURIComponent(next)}` : "";
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except the unlock screen, the calendar feed, cron, and static assets.
  matcher: [
    "/((?!unlock|api/cal|api/cron|_next/static|_next/image|favicon.ico|icon.svg|apple-icon|icons/|manifest.webmanifest).*)",
  ],
};
