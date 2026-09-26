import { prisma } from "@/lib/prisma";
import { createComplexExercise } from "@/app/actions/exercises";
import { ComplexExerciseBuilder } from "@/components/ComplexExerciseBuilder";

export default async function NewComplexExercisePage() {
  const [simpleExercises, allExercises] = await Promise.all([
    prisma.exercise.findMany({
      where: { type: "SIMPLE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, youtubeUrl: true },
    }),
    prisma.exercise.findMany({ select: { name: true } }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Нова комплексна вправа</h1>
      <ComplexExerciseBuilder
        action={createComplexExercise}
        simpleExercises={simpleExercises}
        otherExerciseNames={allExercises.map((e) => e.name)}
        submitLabel="Створити"
      />
    </div>
  );
}
