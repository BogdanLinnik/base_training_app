import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";

export function NavBar({
  user,
}: {
  user: { name?: string | null; email?: string | null };
}) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="hover:text-blue-600">
            Тренування
          </Link>
          <Link href="/exercises/simple" className="hover:text-blue-600">
            Вправи
          </Link>
          <Link href="/trainings/new" className="hover:text-blue-600">
            + Нове тренування
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{user.name ?? user.email}</span>
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
