"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";

export function NavBar({
  user,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const pathname = usePathname();
  const isTrainings = pathname === "/" || pathname.startsWith("/trainings");
  const isExercises = pathname.startsWith("/exercises");

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
