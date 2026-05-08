import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://worktasks.net"),
  title: {
    default: "Worktasks — Task management for teams",
    template: "%s | Worktasks",
  },
  description:
    "Clean task management for individuals and teams. Create tasks, organize workspaces, and get things done together.",
  keywords: ["task management", "todo list", "team collaboration", "workspaces", "productivity"],
  openGraph: {
    title: "Worktasks — Task management for teams",
    description:
      "Clean task management for individuals and teams. Create tasks, organize workspaces, and get things done together.",
    url: "https://worktasks.net",
    siteName: "Worktasks",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Worktasks — Task management for teams",
    description:
      "Clean task management for individuals and teams. Create tasks, organize workspaces, and get things done together.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-900 text-neutral-900`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
