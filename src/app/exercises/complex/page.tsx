import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Tabs } from "@/components/Tabs";
import { canEditExercise } from "@/lib/trainings";

export default async function ComplexExercisesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const exercises = await prisma.exercise.findMany({
    where: { type: "COMPLEX" },
    orderBy: { createdAt: "desc" },
    include: {
      components: {
        orderBy: { order: "asc" },
        include: { childExercise: true },
      },
    },
  });

  return (
    <div>
      <Tabs
        active="/exercises/complex"
        tabs={[
          { href: "/exercises/simple", label: "Прості" },
          { href: "/exercises/complex", label: "Комплексні" },
        ]}
      />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Комплексні вправи</h1>
        <Link
          href="/exercises/complex/new"
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
                <ol className="mt-2 list-decimal list-inside text-sm text-gray-600 space-y-0.5">
                  {exercise.components.map((c) => (
                    <li key={c.id}>{c.childExercise.name}</li>
                  ))}
                </ol>
              </div>
              {canEditExercise(exercise, userId) && (
                <Link
                  href={`/exercises/complex/${exercise.id}/edit`}
                  className="text-sm text-blue-600 hover:underline shrink-0"
                >
                  Редагувати
                </Link>
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
