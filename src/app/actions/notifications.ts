"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Не авторизовано");
  return session.user.id;
}

export async function toggleNotificationRead(notificationId: string) {
  const userId = await requireUserId();
  const notification = await prisma.notification.findUniqueOrThrow({
    where: { id: notificationId },
  });
  if (notification.userId !== userId) throw new Error("Немає доступу");

  await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: notification.readAt ? null : new Date() },
  });

  revalidatePath("/notifications");
}

/** Marks the notification read and sends the user to the related training. */
export async function openNotification(notificationId: string) {
  const userId = await requireUserId();
  const notification = await prisma.notification.findUniqueOrThrow({
    where: { id: notificationId },
  });
  if (notification.userId !== userId) throw new Error("Немає доступу");

  if (!notification.readAt) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  redirect(`/trainings/${notification.trainingId}`);
}

export async function updateNotificationSettings(formData: FormData) {
  const userId = await requireUserId();

  const data = {
    emailOnStatusChange: formData.get("emailOnStatusChange") === "on",
    emailOnTrainingCreatedForYou: formData.get("emailOnTrainingCreatedForYou") === "on",
    emailOnComment: formData.get("emailOnComment") === "on",
  };

  await prisma.notificationSettings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  revalidatePath("/settings");
}
