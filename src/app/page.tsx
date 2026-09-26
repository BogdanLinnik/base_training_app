import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { TrainingCard } from "@/components/TrainingCard";
import { AddButton } from "@/components/AddButton";

type Tab = "mine" | "forme" | "proposed";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { tab: tabParam } = await searchParams;
  const tab: Tab = tabParam === "forme" || tabParam === "proposed" ? tabParam : "mine";

  const where: Prisma.TrainingWhereInput =
    tab === "mine"
      ? { createdById: userId }
      : tab === "forme"
        ? { forUserId: userId, status: { in: ["ACCEPTED", "IN_PROGRESS", "DONE"] } }
        : { forUserId: userId, status: "PENDING_REVIEW" };

  const trainings = await prisma.training.findMany({
    where,
    orderBy: { expectedDate: "desc" },
    include: {
      createdBy: { select: { name: true, email: true } },
      forUser: { select: { name: true, email: true } },
    },
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "mine", label: "Мої" },
    { key: "forme", label: "Для мене" },
    { key: "proposed", label: "Запропоновані" },
  ];

  return (
    <div>
      <div className="border-b border-gray-200 mb-6 flex items-center justify-between gap-3">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.key === "mine" ? "/" : `/?tab=${t.key}`}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
                tab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <div className="mb-2 shrink-0">
          <AddButton href="/trainings/new" label="Нове тренування" />
        </div>
      </div>

      <div className="space-y-3">
        {trainings.map((training) => (
          <TrainingCard key={training.id} training={training} currentUserId={userId} />
        ))}
        {trainings.length === 0 && (
          <p className="text-gray-500 text-sm">Тут поки нічого немає.</p>
        )}
      </div>
    </div>
  );
}
