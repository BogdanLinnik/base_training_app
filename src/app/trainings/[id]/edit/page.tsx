import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditTraining } from "@/lib/trainings";
import { updateTraining } from "@/app/actions/trainings";
import { TrainingBuilder, type TrainingBuilderDefaultValues } from "@/components/TrainingBuilder";
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
        exercises: { orderBy: { order: "asc" }, include: { childValues: true } },
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

  const defaultValues: TrainingBuilderDefaultValues = {
    name: training.name,
    forUserId: training.forUserId,
    expectedDate: training.expectedDate.toISOString().slice(0, 10),
    description: training.description ?? "",
    exercises: training.exercises.map((te) => ({
      exerciseId: te.exerciseId,
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
    })),
  };

  const updateWithId = updateTraining.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Редагувати тренування</h1>
      <TrainingBuilder
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
