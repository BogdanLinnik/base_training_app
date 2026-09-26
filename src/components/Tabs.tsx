import Link from "next/link";

export function Tabs({
  tabs,
  active,
}: {
  tabs: { href: string; label: string }[];
  active: string;
}) {
  return (
    <div className="border-b border-gray-200 mb-6 flex gap-6">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`pb-3 text-sm font-medium border-b-2 -mb-px ${
            tab.href === active
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
