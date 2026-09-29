import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditExercise, isExerciseAuthor } from "@/lib/trainings";
import { updateSimpleExercise } from "@/app/actions/exercises";
import { SimpleExerciseForm } from "@/components/SimpleExerciseForm";
import type { AttributeType } from "@/lib/exercises";
import { ExerciseEditors } from "@/components/ExerciseEditors";
import { notFound, redirect } from "next/navigation";

export default async function EditSimpleExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const [exercise, otherExercises] = await Promise.all([
    prisma.exercise.findUnique({ where: { id }, include: { editors: true } }),
    prisma.exercise.findMany({ where: { id: { not: id } }, select: { name: true } }),
  ]);
  if (!exercise || exercise.type !== "SIMPLE") notFound();
  if (!canEditExercise(exercise, userId)) redirect("/exercises/simple");

  const updateWithId = updateSimpleExercise.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Редагувати вправу</h1>
      <SimpleExerciseForm
        action={updateWithId}
        submitLabel="Зберегти"
        otherExerciseNames={otherExercises.map((e) => e.name)}
        defaultValues={{
          name: exercise.name,
          details: exercise.details,
          youtubeUrl: exercise.youtubeUrl,
          attributeTypes: exercise.attributeTypes as AttributeType[],
        }}
      />
      {isExerciseAuthor(exercise, userId) && (
        <ExerciseEditors exerciseId={exercise.id} authorId={exercise.createdById} />
      )}
    </div>
  );
}
