"use client";

import { SubmitButton } from "@/components/SubmitButton";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";

const NAV_LINKS = [
  { href: "/", label: "Тренування", match: (p: string) => p === "/" || p.startsWith("/trainings") },
  { href: "/exercises/simple", label: "Вправи", match: (p: string) => p.startsWith("/exercises") },
  { href: "/notifications", label: "Нотифікації", match: (p: string) => p.startsWith("/notifications") },
  { href: "/settings", label: "Налаштування", match: (p: string) => p.startsWith("/settings") },
];

export function NavBar({
  user,
  unreadCount,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  unreadCount: number;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const avatar = user.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={user.image}
      alt=""
      referrerPolicy="no-referrer"
      className="w-6 h-6 rounded-full object-cover shrink-0"
    />
  ) : null;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Mobile: menu button + title */}
        <div className="flex items-center gap-3 sm:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Відкрити меню"
            className="p-1 -ml-1 text-gray-700"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <span className="font-semibold">Тренування</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-4 text-sm font-medium">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 ${
                link.match(pathname) ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {link.label}
              {link.href === "/notifications" && unreadCount > 0 && (
                <UnreadBadge count={unreadCount} />
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop user info */}
        <div className="hidden sm:flex items-center gap-3 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            Привіт, {user.name ?? user.email}
            {avatar}
          </span>
          <form action={signOutAction}>
            <SubmitButton className="text-blue-600 hover:underline">
              Вийти
            </SubmitButton>
          </form>
        </div>

        {/* Mobile: notifications shortcut on the right */}
        <Link href="/notifications" aria-label="Нотифікації" className="relative sm:hidden p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5">
              <UnreadBadge count={unreadCount} />
            </span>
          )}
        </Link>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-semibold">Меню</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Закрити меню"
                className="p-1 text-gray-500"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-col p-2 text-sm font-medium">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between gap-2 rounded-md px-3 py-2.5 ${
                    link.match(pathname)
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                  {link.href === "/notifications" && unreadCount > 0 && (
                    <UnreadBadge count={unreadCount} />
                  )}
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t border-gray-100 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {avatar}
                <span className="truncate">{user.name ?? user.email}</span>
              </div>
              <form action={signOutAction}>
                <SubmitButton
                 
                  className="text-sm text-blue-600 hover:underline"
                >
                  Вийти
                </SubmitButton>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function UnreadBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-blue-600 text-white text-xs font-semibold">
      {count > 99 ? "99+" : count}
    </span>
  );
}
