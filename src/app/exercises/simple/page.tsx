import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Tabs } from "@/components/Tabs";
import { AddButton } from "@/components/AddButton";
import { ATTRIBUTE_LABELS, type AttributeType } from "@/lib/exercises";
import { canEditExercise } from "@/lib/trainings";
import { VideoButton } from "@/components/VideoButton";
import { getUsedExerciseIds } from "@/lib/exerciseUsage";
import { deleteExercise } from "@/app/actions/exercises";

export default async function SimpleExercisesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [exercises, usedExerciseIds] = await Promise.all([
    prisma.exercise.findMany({
      where: { type: "SIMPLE" },
      orderBy: { createdAt: "desc" },
    }),
    getUsedExerciseIds(),
  ]);

  return (
    <div>
      <Tabs
        active="/exercises/simple"
        tabs={[
          { href: "/exercises/simple", label: "Прості" },
          { href: "/exercises/complex", label: "Комплексні" },
        ]}
        right={<AddButton href="/exercises/simple/new" label="Нова вправа" />}
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
                <div className="mt-2 flex flex-wrap gap-1">
                  {(exercise.attributeTypes as AttributeType[]).map((attr) => (
                    <span
                      key={attr}
                      className="text-xs rounded-full bg-gray-100 px-2 py-0.5 text-gray-600"
                    >
                      {ATTRIBUTE_LABELS[attr]}
                    </span>
                  ))}
                </div>
                {exercise.youtubeUrl && (
                  <div className="mt-2">
                    <VideoButton url={exercise.youtubeUrl} />
                  </div>
                )}
              </div>
              {canEditExercise(exercise, userId) && (
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/exercises/simple/${exercise.id}/edit`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Редагувати
                  </Link>
                  {usedExerciseIds.has(exercise.id) ? (
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
          <p className="text-gray-500 text-sm">Ще немає жодної простої вправи.</p>
        )}
      </ul>
    </div>
  );
}
