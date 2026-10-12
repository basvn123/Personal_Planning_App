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

// Some iOS versions end a home-screen app's viewport above the home indicator
// while still reporting the safe-area inset, which leaves an empty strip under
// the bottom bar. Measure the strip so the shell can reach the real screen edge.
// A gap over 60px is the keyboard, not the strip.
const screenGapScript = `(function(){function f(){try{var s=navigator.standalone||matchMedia("(display-mode: standalone)").matches;var p=innerHeight>innerWidth;var g=s?(p?screen.height:screen.width)-innerHeight:0;document.documentElement.style.setProperty("--screen-gap",(g>0&&g<=60?g:0)+"px")}catch(e){}}f();addEventListener("resize",f);addEventListener("orientationchange",function(){setTimeout(f,300)})})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: screenGapScript }} />
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
