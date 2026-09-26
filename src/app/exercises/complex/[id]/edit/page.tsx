import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditExercise } from "@/lib/trainings";
import { updateComplexExercise } from "@/app/actions/exercises";
import { ComplexExerciseForm } from "@/components/ComplexExerciseForm";
import { notFound, redirect } from "next/navigation";

export default async function EditComplexExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  const [exercise, simpleExercises] = await Promise.all([
    prisma.exercise.findUnique({
      where: { id },
      include: { components: { orderBy: { order: "asc" } } },
    }),
    prisma.exercise.findMany({
      where: { type: "SIMPLE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!exercise || exercise.type !== "COMPLEX") notFound();
  if (!canEditExercise(exercise, userId)) redirect("/exercises/complex");

  const order = Object.fromEntries(
    exercise.components.map((c, index) => [c.childExerciseId, index + 1])
  );

  const updateWithId = updateComplexExercise.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Редагувати комплексну вправу</h1>
      <ComplexExerciseForm
        action={updateWithId}
        simpleExercises={simpleExercises}
        submitLabel="Зберегти"
        defaultValues={{ name: exercise.name, details: exercise.details, order }}
      />
    </div>
  );
}
