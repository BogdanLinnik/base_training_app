import { prisma } from "@/lib/prisma";
import { createSimpleExercise } from "@/app/actions/exercises";
import { SimpleExerciseForm } from "@/components/SimpleExerciseForm";

export default async function NewSimpleExercisePage() {
  const exercises = await prisma.exercise.findMany({ select: { name: true } });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Нова проста вправа</h1>
      <SimpleExerciseForm
        action={createSimpleExercise}
        otherExerciseNames={exercises.map((e) => e.name)}
        submitLabel="Створити"
      />
    </div>
  );
}
