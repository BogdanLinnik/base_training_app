"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";

export function NavBar({
  user,
  unreadCount,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  unreadCount: number;
}) {
  const pathname = usePathname();
  const isTrainings = pathname === "/" || pathname.startsWith("/trainings");
  const isExercises = pathname.startsWith("/exercises");
  const isNotifications = pathname.startsWith("/notifications");
  const isSettings = pathname.startsWith("/settings");

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link
            href="/"
            className={isTrainings ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}
          >
            Тренування
          </Link>
          <Link
            href="/exercises/simple"
            className={isExercises ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}
          >
            Вправи
          </Link>
          <Link
            href="/notifications"
            className={`flex items-center gap-1.5 ${
              isNotifications ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
            }`}
          >
            Нотифікації
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-blue-600 text-white text-xs font-semibold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          <Link
            href="/settings"
            className={isSettings ? "text-blue-600" : "text-gray-700 hover:text-blue-600"}
          >
            Налаштування
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            Привіт, {user.name ?? user.email}
            {user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover"
              />
            )}
          </span>
          <form action={signOutAction}>
            <button type="submit" className="text-blue-600 hover:underline">
              Вийти
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
