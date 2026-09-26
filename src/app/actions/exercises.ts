"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditExercise } from "@/lib/trainings";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизовано");
  return session.user.id;
}

const ATTRIBUTE_VALUES = ["WEIGHT", "TIME", "REPS"] as const;

function parseAttributeTypes(formData: FormData) {
  return ATTRIBUTE_VALUES.filter((key) => formData.get(`attr_${key}`) === "on");
}

export async function createSimpleExercise(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const youtubeUrl = String(formData.get("youtubeUrl") ?? "").trim();
  if (!name) throw new Error("Назва обов'язкова");

  await prisma.exercise.create({
    data: {
      type: "SIMPLE",
      name,
      details: details || null,
      youtubeUrl: youtubeUrl || null,
      attributeTypes: parseAttributeTypes(formData),
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
  if (!name) throw new Error("Назва обов'язкова");

  await prisma.exercise.update({
    where: { id: exerciseId },
    data: {
      name,
      details: details || null,
      youtubeUrl: youtubeUrl || null,
      attributeTypes: parseAttributeTypes(formData),
    },
  });

  revalidatePath("/exercises/simple");
  redirect("/exercises/simple");
}

function parseOrderedChildIds(formData: FormData) {
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

export async function createComplexExercise(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const childIds = parseOrderedChildIds(formData);
  if (!name) throw new Error("Назва обов'язкова");
  if (childIds.length === 0) throw new Error("Оберіть хоча б одну вправу і вкажіть порядок");

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
  if (childIds.length === 0) throw new Error("Оберіть хоча б одну вправу і вкажіть порядок");

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
