import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import {
  describeNotification,
  NOTIFICATION_EMAIL_SUBJECTS,
  NOTIFICATION_TYPE_TO_SETTING,
  type NotificationType,
} from "@/lib/notifications";

/**
 * Creates an in-app Notification for the recipient and, if they haven't
 * turned it off in NotificationSettings, emails them too. Email delivery is
 * best-effort (sendMail never throws) so it can't break the calling action.
 */
export async function notifyUser(params: {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  trainingId: string;
  data?: Prisma.InputJsonValue;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.recipientId,
      actorId: params.actorId,
      type: params.type,
      trainingId: params.trainingId,
      data: params.data,
    },
  });

  const [recipient, actor, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: params.recipientId }, select: { email: true } }),
    prisma.user.findUnique({
      where: { id: params.actorId },
      select: { name: true, email: true },
    }),
    prisma.notificationSettings.findUnique({ where: { userId: params.recipientId } }),
  ]);
  if (!recipient) return notification;

  const settingKey = NOTIFICATION_TYPE_TO_SETTING[params.type];
  const emailEnabled = settings ? settings[settingKey] : true;
  if (!emailEnabled) return notification;

  const subject = NOTIFICATION_EMAIL_SUBJECTS[params.type];
  const body = describeNotification({ type: params.type, data: params.data ?? null, actor });
  const link = `${process.env.AUTH_URL ?? ""}/trainings/${params.trainingId}`;

  await sendMail(recipient.email, subject, `${body}\n\nПереглянути: ${link}`);

  return notification;
}
