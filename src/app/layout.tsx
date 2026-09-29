import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Base Training",
  description: "Застосунок для планування та відстеження тренувань",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const unreadCount = session?.user
    ? await prisma.notification.count({ where: { userId: session.user.id, readAt: null } })
    : 0;

  return (
    <html
      lang="uk"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {session?.user && <NavBar user={session.user} unreadCount={unreadCount} />}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
