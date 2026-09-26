import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditTraining } from "@/lib/trainings";
import { updateTraining } from "@/app/actions/trainings";
import { TrainingForm, type TrainingDefaultValues } from "@/components/TrainingForm";
import type { AttributeType } from "@/lib/exercises";

export default async function EditTrainingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const [training, users, exercises] = await Promise.all([
    prisma.training.findUnique({
      where: { id },
      include: {
        exercises: { include: { childValues: true } },
      },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.exercise.findMany({
      orderBy: { name: "asc" },
      include: { components: { orderBy: { order: "asc" }, include: { childExercise: true } } },
    }),
  ]);

  if (!training) notFound();
  if (!canEditTraining(training, userId)) redirect(`/trainings/${id}`);

  const defaultValues: TrainingDefaultValues = {
    forUserId: training.forUserId,
    expectedDate: training.expectedDate.toISOString().slice(0, 10),
    description: training.description ?? "",
    exercises: Object.fromEntries(
      training.exercises.map((te) => [
        te.exerciseId,
        {
          order: te.order,
          roundsCount: te.roundsCount,
          plannedWeight: te.plannedWeight,
          plannedTime: te.plannedTime,
          plannedReps: te.plannedReps,
          childValues: Object.fromEntries(
            te.childValues.map((cv) => [
              cv.childExerciseId,
              {
                plannedWeight: cv.plannedWeight,
                plannedTime: cv.plannedTime,
                plannedReps: cv.plannedReps,
              },
            ])
          ),
        },
      ])
    ),
  };

  const updateWithId = updateTraining.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Редагувати тренування</h1>
      <TrainingForm
        action={updateWithId}
        users={users}
        currentUserId={userId}
        submitLabel="Зберегти"
        defaultValues={defaultValues}
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
