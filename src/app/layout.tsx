import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const ui = Schibsted_Grotesk({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
});

const figures = JetBrains_Mono({
  variable: "--font-figures",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Planning", template: "%s · Planning" },
  applicationName: "Planning",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Planning" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1f4a3b" },
    { media: "(prefers-color-scheme: dark)", color: "#16302a" },
  ],
  viewportFit: "cover",
};

// Applies a stored theme before first paint so there is no flash.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${ui.variable} ${figures.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
