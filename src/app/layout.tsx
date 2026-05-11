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
    default: "Worktasks — Free To Do App for Individuals and Teams",
    template: "%s | Worktasks",
  },
  description:
    "Worktasks is a free to do application for individuals and teams. Create tasks, organize team workspaces, and get things done together.",
  keywords: ["to do application", "free to do app", "todo app", "task management", "free task manager", "team todo", "team collaboration", "workspaces", "productivity"],
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png" },
    ],
  },
  openGraph: {
    title: "Worktasks — Free To Do App for Individuals and Teams",
    description:
      "Worktasks is a free to do application for individuals and teams. Create tasks, organize team workspaces, and get things done together.",
    url: "https://worktasks.net",
    siteName: "Worktasks",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Worktasks — Free To Do App for Individuals and Teams",
    description:
      "Worktasks is a free to do application for individuals and teams. Create tasks, organize team workspaces, and get things done together.",
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
