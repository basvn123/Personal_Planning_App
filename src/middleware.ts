import { NextResponse, type NextRequest } from "next/server";
import { checkSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const session = await checkSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) {
    const res = NextResponse.next();
    // Sliding expiry: every visit pushes the year forward, so the home-screen app stays signed in.
    if (session.renewed) res.cookies.set(SESSION_COOKIE, session.renewed, sessionCookieOptions);
    return res;
  }

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
