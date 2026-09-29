import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditExercise, isExerciseAuthor } from "@/lib/trainings";
import { updateComplexExercise } from "@/app/actions/exercises";
import { ComplexExerciseBuilder } from "@/components/ComplexExerciseBuilder";
import { ExerciseEditors } from "@/components/ExerciseEditors";
import { notFound, redirect } from "next/navigation";

export default async function EditComplexExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const [exercise, simpleExercises, otherExercises] = await Promise.all([
    prisma.exercise.findUnique({
      where: { id },
      include: { components: { orderBy: { order: "asc" } }, editors: true },
    }),
    prisma.exercise.findMany({
      where: { type: "SIMPLE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, youtubeUrl: true },
    }),
    prisma.exercise.findMany({ where: { id: { not: id } }, select: { name: true } }),
  ]);

  if (!exercise || exercise.type !== "COMPLEX") notFound();
  if (!canEditExercise(exercise, userId)) redirect("/exercises/complex");

  const updateWithId = updateComplexExercise.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Редагувати комплексну вправу</h1>
      <ComplexExerciseBuilder
        action={updateWithId}
        simpleExercises={simpleExercises}
        submitLabel="Зберегти"
        otherExerciseNames={otherExercises.map((e) => e.name)}
        defaultValues={{
          name: exercise.name,
          details: exercise.details ?? "",
          children: exercise.components.map((c) => c.childExerciseId),
        }}
      />
      {isExerciseAuthor(exercise, userId) && (
        <ExerciseEditors exerciseId={exercise.id} authorId={exercise.createdById} />
      )}
    </div>
  );
}
