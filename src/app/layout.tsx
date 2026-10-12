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

// iOS 26 home-screen apps with a translucent status bar get a viewport one
// status bar short: an empty strip under the bottom bar that nothing paints into.
// Measure it so the root and the shell can grow over it. The keyboard also
// shrinks the viewport, so a jump over 80px keeps the last good value. The
// document itself must never scroll (all scrolling happens inside the pages),
// so any leftover scroll snaps back once no field has focus.
const screenGapScript = `(function(){var d=document.documentElement;function f(){try{var s=navigator.standalone||matchMedia("(display-mode: standalone)").matches;var g=s?(innerHeight>innerWidth?screen.height:screen.width)-innerHeight:0;if(g<0)g=0;if(g<=80){d.style.setProperty("--screen-gap",g+"px")}}catch(e){}}function typing(){var a=document.activeElement;return a&&(/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.isContentEditable)}f();addEventListener("resize",f);addEventListener("orientationchange",function(){setTimeout(f,300)});addEventListener("scroll",function(){if(scrollY&&!typing())scrollTo(0,0)},{passive:true});addEventListener("focusout",function(){setTimeout(function(){if(scrollY&&!typing())scrollTo(0,0)},150)})})()`;

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
