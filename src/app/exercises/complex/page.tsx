import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Tabs } from "@/components/Tabs";
import { AddButton } from "@/components/AddButton";
import { canEditExercise, isExerciseAuthor } from "@/lib/trainings";
import { getUsedExerciseIds } from "@/lib/exerciseUsage";
import { deleteExercise } from "@/app/actions/exercises";

export default async function ComplexExercisesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [exercises, usedExerciseIds] = await Promise.all([
    prisma.exercise.findMany({
      where: { type: "COMPLEX" },
      orderBy: { createdAt: "desc" },
      include: {
        editors: true,
        components: {
          orderBy: { order: "asc" },
          include: { childExercise: true },
        },
      },
    }),
    getUsedExerciseIds(),
  ]);

  return (
    <div>
      <Tabs
        active="/exercises/complex"
        tabs={[
          { href: "/exercises/simple", label: "Прості" },
          { href: "/exercises/complex", label: "Комплексні" },
        ]}
        right={<AddButton href="/exercises/complex/new" label="Нова вправа" />}
      />

      <ul className="space-y-3">
        {exercises.map((exercise) => (
          <li key={exercise.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div className="min-w-0">
                <div className="font-medium">{exercise.name}</div>
                {exercise.details && (
                  <p className="text-sm text-gray-600 mt-1">{exercise.details}</p>
                )}
                <ol className="mt-2 list-decimal list-inside text-sm text-gray-600 space-y-0.5">
                  {exercise.components.map((c) => (
                    <li key={c.id}>{c.childExercise.name}</li>
                  ))}
                </ol>
              </div>
              {canEditExercise(exercise, userId) && (
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/exercises/complex/${exercise.id}/edit`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Редагувати
                  </Link>
                  {!isExerciseAuthor(exercise, userId) ? null : usedExerciseIds.has(exercise.id) ? (
                    <span className="text-xs text-gray-400">Використовується</span>
                  ) : (
                    <form
                      action={async () => {
                        "use server";
                        await deleteExercise(exercise.id);
                      }}
                    >
                      <button type="submit" className="text-sm text-red-600 hover:underline">
                        Видалити
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
        {exercises.length === 0 && (
          <p className="text-gray-500 text-sm">Ще немає жодної комплексної вправи.</p>
        )}
      </ul>
    </div>
  );
}
