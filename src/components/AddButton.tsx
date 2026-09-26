import Link from "next/link";

export function AddButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white text-xl leading-none hover:bg-blue-700 sm:w-auto sm:h-auto sm:rounded-md sm:text-sm sm:px-3 sm:py-1.5"
    >
      <span aria-hidden="true">+</span>
      <span className="hidden sm:inline sm:ml-1">{label}</span>
    </Link>
  );
}
