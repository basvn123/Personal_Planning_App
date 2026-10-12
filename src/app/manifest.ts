import type { MetadataRoute } from "next";

/** Lets phones install the app with its own name and icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Planning",
    short_name: "Planning",
    lang: "nl",
    start_url: "/week",
    scope: "/",
    display: "standalone",
    background_color: "#1f4a3b",
    theme_color: "#1f4a3b",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
