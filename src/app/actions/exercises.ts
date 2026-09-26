"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditExercise } from "@/lib/trainings";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизовано");
  return session.user.id;
}

const ATTRIBUTE_VALUES = ["WEIGHT", "TIME", "REPS"] as const;

function parseAttributeTypes(formData: FormData) {
  return ATTRIBUTE_VALUES.filter((key) => formData.get(`attr_${key}`) === "on");
}

/** Exercise names must be unique regardless of case, across simple and complex alike. */
async function assertUniqueExerciseName(name: string, excludeId?: string) {
  const existing = await prisma.exercise.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (existing) throw new Error("Вправа з такою назвою вже існує");
}

export async function createSimpleExercise(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const youtubeUrl = String(formData.get("youtubeUrl") ?? "").trim();
  const attributeTypes = parseAttributeTypes(formData);
  if (!name) throw new Error("Назва обов'язкова");
  if (attributeTypes.length === 0) throw new Error("Оберіть хоча б один атрибут");
  await assertUniqueExerciseName(name);

  await prisma.exercise.create({
    data: {
      type: "SIMPLE",
      name,
      details: details || null,
      youtubeUrl: youtubeUrl || null,
      attributeTypes,
      createdById: userId,
    },
  });

  revalidatePath("/exercises/simple");
  redirect("/exercises/simple");
}

export async function updateSimpleExercise(exerciseId: string, formData: FormData) {
  const userId = await requireUserId();
  const exercise = await prisma.exercise.findUniqueOrThrow({ where: { id: exerciseId } });
  if (!canEditExercise(exercise, userId)) throw new Error("Немає прав на редагування");

  const name = String(formData.get("name") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const youtubeUrl = String(formData.get("youtubeUrl") ?? "").trim();
  const attributeTypes = parseAttributeTypes(formData);
  if (!name) throw new Error("Назва обов'язкова");
  if (attributeTypes.length === 0) throw new Error("Оберіть хоча б один атрибут");
  await assertUniqueExerciseName(name, exerciseId);

  await prisma.exercise.update({
    where: { id: exerciseId },
    data: {
      name,
      details: details || null,
      youtubeUrl: youtubeUrl || null,
      attributeTypes,
    },
  });

  revalidatePath("/exercises/simple");
  redirect("/exercises/simple");
}

const childrenPayloadSchema = z.array(z.string().min(1));

/** Parses and validates the `childrenJson` hidden field from ComplexExerciseBuilder. */
function parseOrderedChildIds(formData: FormData): string[] {
  const raw = formData.get("childrenJson");
  if (typeof raw !== "string") return [];
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new Error("Некоректні дані про вправи");
  }
  return childrenPayloadSchema.parse(parsedJson);
}

export async function createComplexExercise(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const childIds = parseOrderedChildIds(formData);
  if (!name) throw new Error("Назва обов'язкова");
  if (childIds.length < 2) throw new Error("Оберіть щонайменше дві вправи");
  await assertUniqueExerciseName(name);

  await prisma.exercise.create({
    data: {
      type: "COMPLEX",
      name,
      details: details || null,
      createdById: userId,
      components: {
        create: childIds.map((childExerciseId, index) => ({
          childExerciseId,
          order: index,
        })),
      },
    },
  });

  revalidatePath("/exercises/complex");
  redirect("/exercises/complex");
}

export async function updateComplexExercise(exerciseId: string, formData: FormData) {
  const userId = await requireUserId();
  const exercise = await prisma.exercise.findUniqueOrThrow({ where: { id: exerciseId } });
  if (!canEditExercise(exercise, userId)) throw new Error("Немає прав на редагування");

  const name = String(formData.get("name") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const childIds = parseOrderedChildIds(formData);
  if (!name) throw new Error("Назва обов'язкова");
  if (childIds.length < 2) throw new Error("Оберіть щонайменше дві вправи");
  await assertUniqueExerciseName(name, exerciseId);

  await prisma.$transaction([
    prisma.complexExerciseItem.deleteMany({ where: { parentExerciseId: exerciseId } }),
    prisma.exercise.update({
      where: { id: exerciseId },
      data: {
        name,
        details: details || null,
        components: {
          create: childIds.map((childExerciseId, index) => ({
            childExerciseId,
            order: index,
          })),
        },
      },
    }),
  ]);

  revalidatePath("/exercises/complex");
  redirect("/exercises/complex");
}

export async function deleteExercise(exerciseId: string) {
  const userId = await requireUserId();
  const exercise = await prisma.exercise.findUniqueOrThrow({ where: { id: exerciseId } });
  if (!canEditExercise(exercise, userId)) throw new Error("Немає прав видаляти цю вправу");

  const [usedInTraining, usedInComplex] = await Promise.all([
    prisma.trainingExercise.count({ where: { exerciseId } }),
    prisma.complexExerciseItem.count({ where: { childExerciseId: exerciseId } }),
  ]);
  if (usedInTraining > 0 || usedInComplex > 0) {
    throw new Error(
      "Неможливо видалити вправу, яка використовується в тренуванні або комплексній вправі"
    );
  }

  await prisma.exercise.delete({ where: { id: exerciseId } });

  const path = exercise.type === "SIMPLE" ? "/exercises/simple" : "/exercises/complex";
  revalidatePath(path);
}
