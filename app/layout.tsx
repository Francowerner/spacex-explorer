import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { SpeedInsightsLazy } from "@/components/SpeedInsightsLazy";

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
			<head>
				<link rel="dns-prefetch" href="https://api.spacexdata.com" />
				<link rel="preconnect" href="https://api.spacexdata.com" crossOrigin="anonymous" />
			</head>
			<body className="min-h-full bg-zinc-50 text-zinc-900">
				<Providers>
					<ServiceWorkerRegistrar />
					<a href="#main-content" className="skip-to-content">
						Skip to content
					</a>
					<div className="flex min-h-screen flex-col">
						<header className="border-b border-zinc-200/70 bg-white/80">
							<nav
								className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3"
								aria-label="Primary"
							>
								<Link
									href="/"
									className="rounded font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
								>
									SpaceX <span className="text-sky-700">Explorer</span>
								</Link>
								<ul className="flex items-center gap-2 text-sm sm:gap-4">
									<li>
										<Link
											href="/"
											className="rounded px-2 py-1 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
										>
											Launches
										</Link>
									</li>
									<li>
										<Link
											href="/stats"
											className="rounded px-2 py-1 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
										>
											Stats
										</Link>
									</li>
									<li>
										<Link
											href="/compare"
											className="rounded px-2 py-1 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
										>
											Compare
										</Link>
									</li>
									<li>
										<Link
											href="/favorites"
											className="rounded px-2 py-1 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
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
						<footer className="border-t border-zinc-200/70 py-4 text-center text-xs text-zinc-600">
							Data from the unofficial SpaceX REST API v4.
						</footer>
					</div>
				</Providers>
			</body>
			<SpeedInsightsLazy />
		</html>
	);
}
