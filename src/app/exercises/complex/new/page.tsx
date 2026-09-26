import { prisma } from "@/lib/prisma";
import { createComplexExercise } from "@/app/actions/exercises";
import { ComplexExerciseForm } from "@/components/ComplexExerciseForm";

export default async function NewComplexExercisePage() {
  const simpleExercises = await prisma.exercise.findMany({
    where: { type: "SIMPLE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Нова комплексна вправа</h1>
      <ComplexExerciseForm
        action={createComplexExercise}
        simpleExercises={simpleExercises}
        submitLabel="Створити"
      />
    </div>
  );
}
