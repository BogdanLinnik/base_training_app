"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  canEnterResults,
  canTransition,
  canEditTraining,
  initialStatusFor,
  type TrainingStatus,
} from "@/lib/trainings";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизовано");
  return session.user.id;
}

function numberOrNull(value: FormDataEntryValue | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

/** Parses `order_<exerciseId>` fields into exercise ids sorted by that order. */
function parseSelectedExerciseIds(formData: FormData): string[] {
  const entries: { id: string; order: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("order_")) continue;
    const order = Number(value);
    if (!value || Number.isNaN(order) || order <= 0) continue;
    entries.push({ id: key.slice("order_".length), order });
  }
  entries.sort((a, b) => a.order - b.order);
  return entries.map((e) => e.id);
}

async function buildTrainingExercisesData(formData: FormData) {
  const exerciseIds = parseSelectedExerciseIds(formData);
  if (exerciseIds.length === 0) throw new Error("Оберіть хоча б одну вправу");

  const exercises = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds } },
    include: { components: { orderBy: { order: "asc" } } },
  });
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  return exerciseIds.map((exerciseId, order) => {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise) throw new Error("Вправу не знайдено");

    if (exercise.type === "SIMPLE") {
      return {
        exerciseId,
        order,
        roundsCount: 1,
        plannedWeight: numberOrNull(formData.get(`weight_${exerciseId}`)),
        plannedTime: numberOrNull(formData.get(`time_${exerciseId}`)),
        plannedReps: numberOrNull(formData.get(`reps_${exerciseId}`)),
      };
    }

    const roundsCount = Math.max(1, numberOrNull(formData.get(`rounds_${exerciseId}`)) ?? 1);
    return {
      exerciseId,
      order,
      roundsCount,
      childValues: {
        create: exercise.components.map((c) => ({
          childExerciseId: c.childExerciseId,
          plannedWeight: numberOrNull(
            formData.get(`childweight_${exerciseId}__${c.childExerciseId}`)
          ),
          plannedTime: numberOrNull(
            formData.get(`childtime_${exerciseId}__${c.childExerciseId}`)
          ),
          plannedReps: numberOrNull(
            formData.get(`childreps_${exerciseId}__${c.childExerciseId}`)
          ),
        })),
      },
    };
  });
}

export async function createTraining(formData: FormData) {
  const userId = await requireUserId();
  const forUserId = String(formData.get("forUserId") ?? "");
  const expectedDateRaw = String(formData.get("expectedDate") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  if (!forUserId) throw new Error("Оберіть, для кого тренування");
  if (!expectedDateRaw) throw new Error("Оберіть очікувану дату");

  const trainingExercisesData = await buildTrainingExercisesData(formData);
  const status: TrainingStatus = initialStatusFor(userId, forUserId);

  const training = await prisma.training.create({
    data: {
      createdById: userId,
      forUserId,
      expectedDate: new Date(expectedDateRaw),
      description: description || null,
      status,
      exercises: { create: trainingExercisesData },
    },
  });

  revalidatePath("/");
  redirect(`/trainings/${training.id}`);
}

export async function updateTraining(trainingId: string, formData: FormData) {
  const userId = await requireUserId();
  const training = await prisma.training.findUniqueOrThrow({ where: { id: trainingId } });
  if (!canEditTraining(training, userId)) throw new Error("Немає прав редагувати це тренування");

  const forUserId = String(formData.get("forUserId") ?? "");
  const expectedDateRaw = String(formData.get("expectedDate") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  if (!forUserId) throw new Error("Оберіть, для кого тренування");
  if (!expectedDateRaw) throw new Error("Оберіть очікувану дату");

  const trainingExercisesData = await buildTrainingExercisesData(formData);
  const status: TrainingStatus = initialStatusFor(userId, forUserId);

  await prisma.$transaction([
    prisma.trainingExercise.deleteMany({ where: { trainingId } }),
    prisma.training.update({
      where: { id: trainingId },
      data: {
        forUserId,
        expectedDate: new Date(expectedDateRaw),
        description: description || null,
        status,
        exercises: { create: trainingExercisesData },
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath(`/trainings/${trainingId}`);
  redirect(`/trainings/${trainingId}`);
}

export async function changeTrainingStatus(trainingId: string, formData: FormData) {
  void formData;
  const userId = await requireUserId();
  const training = await prisma.training.findUniqueOrThrow({ where: { id: trainingId } });

  const transition = canTransition(training, userId);
  if (!transition) throw new Error("Перехід статусу неможливий");

  await prisma.training.update({
    where: { id: trainingId },
    data: { status: transition.to },
  });

  revalidatePath(`/trainings/${trainingId}`);
  revalidatePath("/");
}

export async function submitTrainingResults(trainingId: string, formData: FormData) {
  const userId = await requireUserId();
  const training = await prisma.training.findUniqueOrThrow({ where: { id: trainingId } });
  if (!canEnterResults(training, userId)) throw new Error("Немає прав вносити результати");

  type ResultKey = { trainingExerciseId: string; round: number; childExerciseId: string | null };
  const results = new Map<string, ResultKey & { weight: number | null; time: number | null; reps: number | null }>();

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("res__")) continue;
    const [, trainingExerciseId, roundRaw, childRaw, attr] = key.split("__");
    const round = Number(roundRaw);
    const childExerciseId = childRaw === "self" ? null : childRaw;
    const mapKey = `${trainingExerciseId}__${round}__${childRaw}`;

    const existing = results.get(mapKey) ?? {
      trainingExerciseId,
      round,
      childExerciseId,
      weight: null,
      time: null,
      reps: null,
    };
    if (attr === "weight") existing.weight = numberOrNull(value);
    if (attr === "time") existing.time = numberOrNull(value);
    if (attr === "reps") existing.reps = numberOrNull(value);
    results.set(mapKey, existing);
  }

  await prisma.$transaction([
    prisma.trainingExerciseResult.deleteMany({
      where: { trainingExercise: { trainingId } },
    }),
    ...Array.from(results.values()).map((r) =>
      prisma.trainingExerciseResult.create({
        data: {
          trainingExerciseId: r.trainingExerciseId,
          roundIndex: r.round,
          childExerciseId: r.childExerciseId,
          actualWeight: r.weight,
          actualTime: r.time,
          actualReps: r.reps,
        },
      })
    ),
  ]);

  revalidatePath(`/trainings/${trainingId}`);
}

export async function addComment(trainingId: string, formData: FormData) {
  const userId = await requireUserId();
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  const training = await prisma.training.findUniqueOrThrow({ where: { id: trainingId } });
  if (training.createdById !== userId && training.forUserId !== userId) {
    throw new Error("Немає прав коментувати це тренування");
  }

  await prisma.comment.create({ data: { trainingId, authorId: userId, text } });
  revalidatePath(`/trainings/${trainingId}`);
}

export async function deleteTraining(trainingId: string) {
  const userId = await requireUserId();
  const training = await prisma.training.findUniqueOrThrow({ where: { id: trainingId } });
  if (!canEditTraining(training, userId)) throw new Error("Немає прав видаляти це тренування");

  await prisma.training.delete({ where: { id: trainingId } });
  revalidatePath("/");
  redirect("/");
}
