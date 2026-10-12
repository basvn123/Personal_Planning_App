import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import { ResumeRefresh } from "@/components/shell/resume-refresh";
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
    { media: "(prefers-color-scheme: light)", color: "#164632" },
    { media: "(prefers-color-scheme: dark)", color: "#163e2d" },
  ],
  viewportFit: "cover",
  // An app, not a page: no pinch zoom, and focusing a field never zooms in.
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
};

// Applies a stored theme before first paint so there is no flash.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

// Marks the home-screen app for iOS versions without display-mode (see the
// standalone block in globals.css). The document itself never scrolls (all
// scrolling happens inside the pages), so leftover scroll, from the keyboard
// or the taller iOS root, snaps back once no field has focus.
const shellScript = `(function(){var d=document.documentElement;try{if(navigator.standalone)d.setAttribute("data-standalone","")}catch(e){}function typing(){var a=document.activeElement;return a&&(/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.isContentEditable)}function snap(){if(scrollY&&!typing())scrollTo(0,0)}addEventListener("scroll",snap,{passive:true});addEventListener("focusout",function(){setTimeout(snap,150)})})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: shellScript }} />
        {/* Next only emits the generic tag; iOS still reads this one to open the home-screen icon as an app. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${ui.variable} ${figures.variable}`}>
        <Providers>{children}</Providers>
        <ResumeRefresh />
      </body>
    </html>
  );
}
