import { appIcon } from "@/lib/app-icon";

const SIZES = new Set([192, 512]);

// Rendered once at build time, then served as static files.
export const dynamic = "force-static";
export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }, { size: "512-maskable" }];
}

/** PNG icons for the web app manifest: /icons/192, /icons/512, /icons/512-maskable. */
export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const maskable = size.endsWith("-maskable");
  const px = Number(size.replace("-maskable", ""));
  if (!SIZES.has(px)) return new Response("Not found", { status: 404 });
  const res = appIcon(px, { maskable });
  res.headers.set("cache-control", "public, max-age=604800, immutable");
  return res;
}
