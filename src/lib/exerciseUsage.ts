import { prisma } from "@/lib/prisma";

/** Ids of exercises referenced by a training exercise or used as a component of a complex exercise. */
export async function getUsedExerciseIds(): Promise<Set<string>> {
  const [trainingExercises, complexItems] = await Promise.all([
    prisma.trainingExercise.findMany({ select: { exerciseId: true }, distinct: ["exerciseId"] }),
    prisma.complexExerciseItem.findMany({
      select: { childExerciseId: true },
      distinct: ["childExerciseId"],
    }),
  ]);

  return new Set([
    ...trainingExercises.map((t) => t.exerciseId),
    ...complexItems.map((c) => c.childExerciseId),
  ]);
}
