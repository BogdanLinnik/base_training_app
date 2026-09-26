import Link from "next/link";
import type { ReactNode } from "react";

export function Tabs({
  tabs,
  active,
  right,
}: {
  tabs: { href: string; label: string }[];
  active: string;
  right?: ReactNode;
}) {
  return (
    <div className="border-b border-gray-200 mb-6 flex items-center justify-between gap-3">
      <div className="flex gap-4 sm:gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
              tab.href === active
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      {right && <div className="mb-2 shrink-0">{right}</div>}
    </div>
  );
}
