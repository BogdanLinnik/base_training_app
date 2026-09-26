import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTraining } from "@/app/actions/trainings";
import { TrainingForm } from "@/components/TrainingForm";
import type { AttributeType } from "@/lib/exercises";

export default async function NewTrainingPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [users, exercises] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.exercise.findMany({
      orderBy: { name: "asc" },
      include: { components: { orderBy: { order: "asc" }, include: { childExercise: true } } },
    }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Нове тренування</h1>
      <TrainingForm
        action={createTraining}
        users={users}
        currentUserId={userId}
        submitLabel="Створити тренування"
        exercises={exercises.map((e) => ({
          ...e,
          attributeTypes: e.attributeTypes as AttributeType[],
          components: e.components.map((c) => ({
            ...c,
            childExercise: {
              ...c.childExercise,
              attributeTypes: c.childExercise.attributeTypes as AttributeType[],
            },
          })),
        }))}
      />
    </div>
  );
}
