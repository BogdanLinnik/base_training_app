import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { describeNotification } from "@/lib/notifications";
import { toggleNotificationRead, openNotification } from "@/app/actions/notifications";

export default async function NotificationsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      actor: { select: { name: true, email: true } },
      training: { select: { expectedDate: true } },
    },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Нотифікації</h1>
      <ul className="space-y-2 max-w-2xl">
        {notifications.map((n) => {
          const isUnread = !n.readAt;
          const toggleWithId = toggleNotificationRead.bind(null, n.id);
          const openWithId = openNotification.bind(null, n.id);

          return (
            <li
              key={n.id}
              className={`flex items-stretch gap-1 rounded-lg border ${
                isUnread ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-white"
              }`}
            >
              <form action={toggleWithId} className="flex items-center pl-3">
                <button
                  type="submit"
                  title={isUnread ? "Позначити прочитаним" : "Позначити непрочитаним"}
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isUnread ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              </form>
              <form action={openWithId} className="flex-1">
                <button type="submit" className="w-full text-left px-3 py-3">
                  <div className="text-sm">{describeNotification(n)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Тренування {n.training.expectedDate.toLocaleDateString("uk-UA")} ·{" "}
                    {n.createdAt.toLocaleString("uk-UA")}
                  </div>
                </button>
              </form>
            </li>
          );
        })}
        {notifications.length === 0 && (
          <p className="text-sm text-gray-500">Тут поки нічого немає.</p>
        )}
      </ul>
    </div>
  );
}
