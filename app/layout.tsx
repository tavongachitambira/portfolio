import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Ambient } from "@/components/layout/ambient";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tavonga Chitambira",
  description: "Tavonga Chitambira Portfolio",
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
        "h-full antialiased font-sans",
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
          <Ambient />
          <div className="fixed top-16 right-4 z-60 lg:top-6 lg:right-6">
           
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
