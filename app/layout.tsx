import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Ambient } from "@/components/layout/ambient";
import { AssistProvider } from "@/components/assist/AssistProvider";
// import { AssistTriggers } from "@/components/assist/AssistTriggers"; // the dock is now rendered through AssistDock
import { AssistDock } from "@/components/assist/AssistDock";
import { isPublished, posts } from "@/lib/data/writing";
import { site } from "@/lib/site";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Portfolio of Tavonga Chitambira: a full stack engineer building real-time and data-driven web products.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description,
  openGraph: { type: "website", siteName: site.name },
  twitter: { card: "summary_large_image" },
  // only advertise the feed once there is something in it
  alternates: posts.some(isPublished) ? { types: { "application/rss+xml": "/feed.xml" } } : undefined,
  other: { "darkreader-lock": "true" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full dark antialiased font-sans",
        jakarta.variable,
        geistMono.variable,
      )}
    >
      <body className="relative flex flex-col min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AssistProvider>
            <Ambient />
            {children}
            {/* Was rendered on every page:
                <AssistTriggers variant="dock" />
                The landing page now has Search/Ask in its own top bar (desktop) and section pill (phone),
                so the corner dock only shows on the other pages. */}
            <Suspense fallback={null}>
              <AssistDock />
            </Suspense>
          </AssistProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}