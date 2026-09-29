"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  canEnterResults,
  canTransition,
  canEditTraining,
  canManageViewers,
  isViewer,
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

const roundValuesSchema = z.object({
  planned: attrValuesSchema.nullable().optional(),
  childValues: z.record(z.string(), attrValuesSchema).optional(),
});

const exercisesPayloadSchema = z.array(
  z.object({
    exerciseId: z.string().min(1),
    roundsCount: z.number().int().min(1).optional(),
    comment: z.string().optional(),
    planned: attrValuesSchema.nullable().optional(),
    childValues: z.record(z.string(), attrValuesSchema).optional(),
    perRound: z.boolean().optional(),
    roundValues: z.array(roundValuesSchema).optional(),
  })
);

type AttrKind = "WEIGHT" | "TIME" | "REPS";
type AttrValuesInput = z.infer<typeof attrValuesSchema>;

/**
 * Planned values for the exercise's declared attributes: each must be filled and
 * not negative (0 is fine). Attributes the exercise doesn't have stay null.
 */
function normalizeAttrs(
  values: AttrValuesInput | null | undefined,
  attrTypes: AttrKind[],
  exerciseName: string
) {
  const result: { weight: number | null; time: number | null; reps: number | null } = {
    weight: null,
    time: null,
    reps: null,
  };
  for (const attr of attrTypes) {
    const key = attr === "WEIGHT" ? "weight" : attr === "TIME" ? "time" : "reps";
    const value = values?.[key];
    if (value == null || value < 0) {
      throw new Error(`Заповніть усі значення атрибутів для вправи «${exerciseName}»`);
    }
    result[key] = value;
  }
  return result;
}

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

    const roundsCount = item.roundsCount;
    if (roundsCount == null || roundsCount < 1) {
      throw new Error(`Вкажіть кількість кіл для вправи «${exercise.name}»`);
    }

    const perRound = item.perRound === true;
    // With per-round values, every round needs its own set; the first round also
    // fills the plain planned fields so they stay meaningful on their own.
    const rounds = perRound ? item.roundValues ?? [] : [];
    if (perRound && rounds.length !== roundsCount) {
      throw new Error(`Вкажіть значення для кожного кола вправи «${exercise.name}»`);
    }

    if (exercise.type === "SIMPLE") {
      const attrTypes = exercise.attributeTypes as AttrKind[];
      const roundPlanned = rounds.map((r) => normalizeAttrs(r.planned, attrTypes, exercise.name));
      const base = perRound ? roundPlanned[0] : normalizeAttrs(item.planned, attrTypes, exercise.name);
      return {
        exerciseId: item.exerciseId,
        order,
        roundsCount,
        comment: item.comment?.trim() || null,
        plannedWeight: base.weight,
        plannedTime: base.time,
        plannedReps: base.reps,
        perRound,
        roundValues: {
          create: roundPlanned.map((v, roundIndex) => ({
            roundIndex,
            plannedWeight: v.weight,
            plannedTime: v.time,
            plannedReps: v.reps,
          })),
        },
      };
    }

    const normalizeChildren = (childValues: Record<string, AttrValuesInput> | undefined) =>
      exercise.components.map((c) => ({
        childExerciseId: c.childExerciseId,
        values: normalizeAttrs(
          childValues?.[c.childExerciseId],
          c.childExercise.attributeTypes as AttrKind[],
          exercise.name
        ),
      }));
    const baseChildren = normalizeChildren(perRound ? rounds[0].childValues : item.childValues);
    const roundChildren = rounds.map((r) => normalizeChildren(r.childValues));
    return {
      exerciseId: item.exerciseId,
      order,
      roundsCount,
      comment: item.comment?.trim() || null,
      perRound,
      childValues: {
        create: baseChildren.map((c) => ({
          childExerciseId: c.childExerciseId,
          plannedWeight: c.values.weight,
          plannedTime: c.values.time,
          plannedReps: c.values.reps,
        })),
      },
      roundValues: {
        create: roundChildren.flatMap((children, roundIndex) =>
          children.map((c) => ({
            roundIndex,
            childExerciseId: c.childExerciseId,
            plannedWeight: c.values.weight,
            plannedTime: c.values.time,
            plannedReps: c.values.reps,
          }))
        ),
      },
    };
  });
}

const TODAY = () => new Date().toISOString().slice(0, 10);

function validateTrainingFields(formData: FormData) {
  const forUserId = String(formData.get("forUserId") ?? "");
  const expectedDateRaw = String(formData.get("expectedDate") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  if (!forUserId) throw new Error("Оберіть, для кого тренування");
  if (!expectedDateRaw) throw new Error("Оберіть очікувану дату");
  if (expectedDateRaw < TODAY()) throw new Error("Дата не може бути раніше сьогодні");

  return { forUserId, expectedDateRaw, description };
}

export async function createTraining(formData: FormData) {
  const userId = await requireUserId();
  const { forUserId, expectedDateRaw, description } = validateTrainingFields(formData);

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

  if (forUserId !== userId) {
    await prisma.notification.create({
      data: {
        userId: forUserId,
        actorId: userId,
        type: "TRAINING_CREATED_FOR_YOU",
        trainingId: training.id,
      },
    });
  }

  revalidatePath("/");
  redirect(`/trainings/${training.id}`);
}

export async function updateTraining(trainingId: string, formData: FormData) {
  const userId = await requireUserId();
  const training = await prisma.training.findUniqueOrThrow({ where: { id: trainingId } });
  if (!canEditTraining(training, userId)) throw new Error("Немає прав редагувати це тренування");

  const { forUserId, expectedDateRaw, description } = validateTrainingFields(formData);

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
  const training = await prisma.training.findUniqueOrThrow({
    where: { id: trainingId },
    include: { viewers: true },
  });

  const transition = canTransition(training, userId);
  if (!transition) throw new Error("Перехід статусу неможливий");

  await prisma.training.update({
    where: { id: trainingId },
    data: { status: transition.to },
  });

  const recipients = new Set<string>();
  if (training.createdById !== userId) recipients.add(training.createdById);
  for (const v of training.viewers) {
    if (v.userId !== userId) recipients.add(v.userId);
  }

  if (recipients.size > 0) {
    await prisma.notification.createMany({
      data: Array.from(recipients).map((recipientId) => ({
        userId: recipientId,
        actorId: userId,
        type: "TRAINING_STATUS_CHANGED" as const,
        trainingId,
        data: { status: transition.to },
      })),
    });
  }

  revalidatePath(`/trainings/${trainingId}`);
  revalidatePath("/");
}

export async function submitTrainingResults(trainingId: string, formData: FormData) {
  const userId = await requireUserId();
  const training = await prisma.training.findUniqueOrThrow({ where: { id: trainingId } });
  if (!canEnterResults(training, userId)) throw new Error("Немає прав вносити результати");

  type ResultKey = {
    trainingExerciseId: string;
    round: number;
    childExerciseId: string | null;
    side: "LEFT" | "RIGHT" | null;
  };
  const results = new Map<string, ResultKey & { weight: number | null; time: number | null; reps: number | null }>();

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("res__")) continue;
    // res__<trainingExerciseId>__<round>__<child|self>__<attr> or, for a
    // bilateral exercise, res__<trainingExerciseId>__<round>__<child|self>__<left|right>__<attr>
    const parts = key.split("__");
    const [, trainingExerciseId, roundRaw, childRaw] = parts;
    const attr = parts[parts.length - 1];
    const sideRaw = parts.length === 6 ? parts[4] : null;
    const side = sideRaw === "left" ? "LEFT" : sideRaw === "right" ? "RIGHT" : null;
    const round = Number(roundRaw);
    const childExerciseId = childRaw === "self" ? null : childRaw;
    const mapKey = `${trainingExerciseId}__${round}__${childRaw}__${side}`;

    const existing = results.get(mapKey) ?? {
      trainingExerciseId,
      round,
      childExerciseId,
      side,
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
          side: r.side,
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

  const training = await prisma.training.findUniqueOrThrow({
    where: { id: trainingId },
    include: { viewers: true },
  });
  const allowed =
    training.createdById === userId || training.forUserId === userId || isViewer(training, userId);
  if (!allowed) {
    throw new Error("Немає прав коментувати це тренування");
  }

  await prisma.comment.create({ data: { trainingId, authorId: userId, text } });

  const recipients = new Set<string>();
  if (training.createdById !== userId) recipients.add(training.createdById);
  if (training.forUserId !== userId) recipients.add(training.forUserId);
  for (const v of training.viewers) {
    if (v.userId !== userId) recipients.add(v.userId);
  }

  if (recipients.size > 0) {
    await prisma.notification.createMany({
      data: Array.from(recipients).map((recipientId) => ({
        userId: recipientId,
        actorId: userId,
        type: "NEW_COMMENT" as const,
        trainingId,
        data: { commentPreview: text.slice(0, 140) },
      })),
    });
  }

  revalidatePath(`/trainings/${trainingId}`);
}

/** Only the creator or the assignee may invite a viewer — someone who can look and comment but not edit. */
export async function addViewer(trainingId: string, formData: FormData) {
  const userId = await requireUserId();
  const viewerUserId = String(formData.get("viewerUserId") ?? "");
  if (!viewerUserId) throw new Error("Оберіть користувача");

  const training = await prisma.training.findUniqueOrThrow({ where: { id: trainingId } });
  if (!canManageViewers(training, userId)) {
    throw new Error("Немає прав додавати глядачів");
  }
  if (viewerUserId === training.createdById || viewerUserId === training.forUserId) {
    throw new Error("Цей користувач вже має доступ до тренування");
  }

  await prisma.trainingViewer.upsert({
    where: { trainingId_userId: { trainingId, userId: viewerUserId } },
    create: { trainingId, userId: viewerUserId, addedById: userId },
    update: {},
  });

  await prisma.notification.create({
    data: {
      userId: viewerUserId,
      actorId: userId,
      type: "TRAINING_VIEWER_ADDED",
      trainingId,
    },
  });

  revalidatePath(`/trainings/${trainingId}`);
}

export async function removeViewer(trainingId: string, viewerUserId: string) {
  const userId = await requireUserId();
  const training = await prisma.training.findUniqueOrThrow({ where: { id: trainingId } });
  if (!canManageViewers(training, userId)) {
    throw new Error("Немає прав видаляти глядачів");
  }

  await prisma.trainingViewer.deleteMany({ where: { trainingId, userId: viewerUserId } });

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

/**
 * Duplicates a training (own or one proposed/assigned to the user). The copy
 * always belongs to whoever duplicated it — both created by and for them —
 * with a fresh expected date (today) and no comments/results/status carried
 * over.
 */
export async function duplicateTraining(trainingId: string) {
  const userId = await requireUserId();
  const training = await prisma.training.findUniqueOrThrow({
    where: { id: trainingId },
    include: {
      exercises: { orderBy: { order: "asc" }, include: { childValues: true, roundValues: true } },
    },
  });
  if (training.createdById !== userId && training.forUserId !== userId) {
    throw new Error("Немає прав дублювати це тренування");
  }

  const newTraining = await prisma.training.create({
    data: {
      createdById: userId,
      forUserId: userId,
      expectedDate: new Date(`${TODAY()}T00:00:00.000Z`),
      description: training.description,
      status: initialStatusFor(userId, userId),
      exercises: {
        create: training.exercises.map((te) => ({
          exerciseId: te.exerciseId,
          order: te.order,
          roundsCount: te.roundsCount,
          plannedWeight: te.plannedWeight,
          plannedTime: te.plannedTime,
          plannedReps: te.plannedReps,
          perRound: te.perRound,
          roundValues: {
            create: te.roundValues.map((rv) => ({
              roundIndex: rv.roundIndex,
              childExerciseId: rv.childExerciseId,
              plannedWeight: rv.plannedWeight,
              plannedTime: rv.plannedTime,
              plannedReps: rv.plannedReps,
            })),
          },
          childValues: {
            create: te.childValues.map((cv) => ({
              childExerciseId: cv.childExerciseId,
              plannedWeight: cv.plannedWeight,
              plannedTime: cv.plannedTime,
              plannedReps: cv.plannedReps,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/");
  redirect(`/trainings/${newTraining.id}`);
}
