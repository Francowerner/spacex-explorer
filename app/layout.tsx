import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpaceX Explorer",
  description:
    "Browse, filter, and save SpaceX launches. Built with Next.js, TanStack Query, and Zustand.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Providers>
          <a href="#main-content" className="skip-to-content">
            Skip to content
          </a>
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
              <nav
                className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3"
                aria-label="Primary"
              >
                <Link
                  href="/"
                  className="font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 rounded"
                >
                  SpaceX <span className="text-sky-500">Explorer</span>
                </Link>
                <ul className="flex items-center gap-4 text-sm">
                  <li>
                    <Link
                      href="/"
                      className="rounded px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                    >
                      Launches
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/favorites"
                      className="rounded px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                    >
                      Favorites
                    </Link>
                  </li>
                </ul>
              </nav>
            </header>
            <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
              {children}
            </main>
            <footer className="border-t border-zinc-200/70 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800/70">
              Data from the unofficial SpaceX REST API v4.
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
