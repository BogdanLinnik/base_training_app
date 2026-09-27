export type TrainingStatus =
  | "CREATED"
  | "PENDING_REVIEW"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "DONE";

export type TrainingTag = "own" | "proposed" | "accepted" | "unconfirmed";

export const STATUS_LABELS: Record<TrainingStatus, string> = {
  CREATED: "Створено",
  PENDING_REVIEW: "На розгляді",
  ACCEPTED: "Прийнято",
  IN_PROGRESS: "Виконується",
  DONE: "Виконане",
};

export const TAG_LABELS: Record<TrainingTag, string> = {
  own: "Власне",
  proposed: "Запропоноване",
  accepted: "Прийняте",
  unconfirmed: "Не підтверджене",
};

type TrainingLike = {
  createdById: string;
  forUserId: string;
  status: TrainingStatus;
};

type TrainingWithViewers = TrainingLike & { viewers: { userId: string }[] };

/** Creator and assignee can manage the training; a viewer can only look and comment. */
export function isViewer(training: TrainingWithViewers, userId: string): boolean {
  return (
    training.createdById !== userId &&
    training.forUserId !== userId &&
    training.viewers.some((v) => v.userId === userId)
  );
}

/** Anyone allowed to open the training's page: creator, assignee, or an invited viewer. */
export function canViewTraining(training: TrainingWithViewers, userId: string): boolean {
  return training.createdById === userId || training.forUserId === userId || isViewer(training, userId);
}

/** Only the creator or the assignee may invite/remove viewers. */
export function canManageViewers(training: TrainingLike, userId: string): boolean {
  return training.createdById === userId || training.forUserId === userId;
}

/** Tags are derived from the relationship + status, never stored directly. */
export function deriveTrainingTags(training: TrainingLike): TrainingTag[] {
  if (training.createdById === training.forUserId) return ["own"];
  if (training.status === "PENDING_REVIEW") return ["proposed", "unconfirmed"];
  return ["accepted"];
}

export function isConfirmed(status: TrainingStatus): boolean {
  return status === "ACCEPTED" || status === "IN_PROGRESS" || status === "DONE";
}

/** Who is allowed to move a training to the next status, and from where. */
export const STATUS_TRANSITIONS: Record<
  TrainingStatus,
  { to: TrainingStatus; actor: "forUser"; label: string } | null
> = {
  CREATED: { to: "IN_PROGRESS", actor: "forUser", label: "Почати" },
  PENDING_REVIEW: { to: "ACCEPTED", actor: "forUser", label: "Підтвердити" },
  ACCEPTED: { to: "IN_PROGRESS", actor: "forUser", label: "Почати" },
  IN_PROGRESS: { to: "DONE", actor: "forUser", label: "Завершити" },
  DONE: null,
};

export function canTransition(
  training: TrainingLike,
  userId: string
): { to: TrainingStatus; label: string } | null {
  const transition = STATUS_TRANSITIONS[training.status];
  if (!transition) return null;
  if (training.forUserId !== userId) return null;
  return { to: transition.to, label: transition.label };
}

export function initialStatusFor(createdById: string, forUserId: string): TrainingStatus {
  return createdById === forUserId ? "CREATED" : "PENDING_REVIEW";
}

export function canEditTraining(training: TrainingLike, userId: string): boolean {
  return (
    training.createdById === userId &&
    training.status !== "IN_PROGRESS" &&
    training.status !== "DONE"
  );
}

export function canEnterResults(training: TrainingLike, userId: string): boolean {
  return training.forUserId === userId && training.status === "IN_PROGRESS";
}

export function canEditExercise(exercise: { createdById: string }, userId: string): boolean {
  return exercise.createdById === userId;
}
