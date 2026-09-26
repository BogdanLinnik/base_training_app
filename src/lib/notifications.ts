import { STATUS_LABELS, type TrainingStatus } from "@/lib/trainings";

export type NotificationType =
  | "TRAINING_STATUS_CHANGED"
  | "TRAINING_CREATED_FOR_YOU"
  | "NEW_COMMENT";

export type NotificationSettingKey =
  | "emailOnStatusChange"
  | "emailOnTrainingCreatedForYou"
  | "emailOnComment";

export const NOTIFICATION_SETTINGS_LABELS: Record<NotificationSettingKey, string> = {
  emailOnStatusChange: "Зміна статусу тренувань, які я створив(ла) для інших",
  emailOnTrainingCreatedForYou: "Створення тренування для мене",
  emailOnComment: "Коментарі на моїх тренуваннях",
};

type NotificationLike = {
  type: NotificationType;
  data: unknown;
  actor: { name: string | null; email: string } | null;
};

/** Builds the human-readable text for a notification row. Pure — easy to unit-test. */
export function describeNotification(n: NotificationLike): string {
  const actorName = n.actor?.name ?? n.actor?.email ?? "Хтось";

  switch (n.type) {
    case "TRAINING_STATUS_CHANGED": {
      const status = (n.data as { status?: string } | null)?.status;
      const label = status && status in STATUS_LABELS ? STATUS_LABELS[status as TrainingStatus] : "";
      return `${actorName} змінив(ла) статус тренування на «${label}»`;
    }
    case "TRAINING_CREATED_FOR_YOU":
      return `${actorName} створив(ла) для вас тренування`;
    case "NEW_COMMENT": {
      const preview = (n.data as { commentPreview?: string } | null)?.commentPreview ?? "";
      return `${actorName} залишив(ла) коментар: «${preview}»`;
    }
  }
}
