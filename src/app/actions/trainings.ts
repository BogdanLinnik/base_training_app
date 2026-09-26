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
import { z } from "zod";

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

const attrValuesSchema = z.object({
  weight: z.number().nullable().optional(),
  time: z.number().nullable().optional(),
  reps: z.number().nullable().optional(),
});

const exercisesPayloadSchema = z.array(
  z.object({
    exerciseId: z.string().min(1),
    roundsCount: z.number().int().min(1).optional(),
    planned: attrValuesSchema.nullable().optional(),
    childValues: z.record(z.string(), attrValuesSchema).optional(),
  })
);

/** Parses and validates the `exercisesJson` hidden field produced by TrainingBuilder. */
async function buildTrainingExercisesData(formData: FormData) {
  const raw = formData.get("exercisesJson");
  if (typeof raw !== "string") throw new Error("Оберіть хоча б одну вправу");

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new Error("Некоректні дані про вправи");
  }

  const payload = exercisesPayloadSchema.parse(parsedJson);
  if (payload.length === 0) throw new Error("Оберіть хоча б одну вправу");

  const exercises = await prisma.exercise.findMany({
    where: { id: { in: payload.map((p) => p.exerciseId) } },
    include: { components: { orderBy: { order: "asc" }, include: { childExercise: true } } },
  });
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  return payload.map((item, order) => {
    const exercise = exerciseById.get(item.exerciseId);
    if (!exercise) throw new Error("Вправу не знайдено");

    if (exercise.type === "SIMPLE") {
      const attrTypes = exercise.attributeTypes as ("WEIGHT" | "TIME" | "REPS")[];
      for (const attr of attrTypes) {
        const key = attr === "WEIGHT" ? "weight" : attr === "TIME" ? "time" : "reps";
        if (item.planned?.[key] == null) {
          throw new Error(`Заповніть усі значення атрибутів для вправи «${exercise.name}»`);
        }
      }
      return {
        exerciseId: item.exerciseId,
        order,
        roundsCount: 1,
        plannedWeight: item.planned?.weight ?? null,
        plannedTime: item.planned?.time ?? null,
        plannedReps: item.planned?.reps ?? null,
      };
    }

    const roundsCount = Math.max(1, item.roundsCount ?? 1);
    for (const c of exercise.components) {
      const childAttrTypes = c.childExercise.attributeTypes as ("WEIGHT" | "TIME" | "REPS")[];
      for (const attr of childAttrTypes) {
        const key = attr === "WEIGHT" ? "weight" : attr === "TIME" ? "time" : "reps";
        if (item.childValues?.[c.childExerciseId]?.[key] == null) {
          throw new Error(`Заповніть усі значення атрибутів для вправи «${exercise.name}»`);
        }
      }
    }
    return {
      exerciseId: item.exerciseId,
      order,
      roundsCount,
      childValues: {
        create: exercise.components.map((c) => ({
          childExerciseId: c.childExerciseId,
          plannedWeight: item.childValues?.[c.childExerciseId]?.weight ?? null,
          plannedTime: item.childValues?.[c.childExerciseId]?.time ?? null,
          plannedReps: item.childValues?.[c.childExerciseId]?.reps ?? null,
        })),
      },
    };
  });
}

const TODAY = () => new Date().toISOString().slice(0, 10);

function validateTrainingFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const forUserId = String(formData.get("forUserId") ?? "");
  const expectedDateRaw = String(formData.get("expectedDate") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  if (!name) throw new Error("Вкажіть назву тренування");
  if (!forUserId) throw new Error("Оберіть, для кого тренування");
  if (!expectedDateRaw) throw new Error("Оберіть очікувану дату");
  if (expectedDateRaw < TODAY()) throw new Error("Дата не може бути раніше сьогодні");

  return { name, forUserId, expectedDateRaw, description };
}

export async function createTraining(formData: FormData) {
  const userId = await requireUserId();
  const { name, forUserId, expectedDateRaw, description } = validateTrainingFields(formData);

  const trainingExercisesData = await buildTrainingExercisesData(formData);
  const status: TrainingStatus = initialStatusFor(userId, forUserId);

  const training = await prisma.training.create({
    data: {
      createdById: userId,
      forUserId,
      name,
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

  const { name, forUserId, expectedDateRaw, description } = validateTrainingFields(formData);

  const trainingExercisesData = await buildTrainingExercisesData(formData);
  const status: TrainingStatus = initialStatusFor(userId, forUserId);

  await prisma.$transaction([
    prisma.trainingExercise.deleteMany({ where: { trainingId } }),
    prisma.training.update({
      where: { id: trainingId },
      data: {
        forUserId,
        name,
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
