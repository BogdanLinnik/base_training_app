import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Tabs } from "@/components/Tabs";
import { ATTRIBUTE_LABELS, type AttributeType } from "@/lib/exercises";
import { canEditExercise } from "@/lib/trainings";

export default async function SimpleExercisesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const exercises = await prisma.exercise.findMany({
    where: { type: "SIMPLE" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Tabs
        active="/exercises/simple"
        tabs={[
          { href: "/exercises/simple", label: "Прості" },
          { href: "/exercises/complex", label: "Комплексні" },
        ]}
      />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Прості вправи</h1>
        <Link
          href="/exercises/simple/new"
          className="rounded-md bg-blue-600 text-white text-sm px-3 py-1.5 hover:bg-blue-700"
        >
          + Нова вправа
        </Link>
      </div>

      <ul className="space-y-3">
        {exercises.map((exercise) => (
          <li key={exercise.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex justify-between items-start gap-3">
              <div>
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
                  <a
                    href={exercise.youtubeUrl}
                    target="_blank"
                    className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                  >
                    Відео на YouTube
                  </a>
                )}
              </div>
              {canEditExercise(exercise, userId) && (
                <Link
                  href={`/exercises/simple/${exercise.id}/edit`}
                  className="text-sm text-blue-600 hover:underline shrink-0"
                >
                  Редагувати
                </Link>
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
