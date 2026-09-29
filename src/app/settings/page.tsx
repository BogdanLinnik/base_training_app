import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NOTIFICATION_SETTINGS_LABELS } from "@/lib/notifications";
import { updateNotificationSettings } from "@/app/actions/notifications";
import { SubmitButton } from "@/components/SubmitButton";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const settings = await prisma.notificationSettings.findUnique({ where: { userId } });

  const fields = [
    "emailOnStatusChange",
    "emailOnTrainingCreatedForYou",
    "emailOnComment",
    "emailOnAddedAsViewer",
  ] as const;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Налаштування</h1>
      <form action={updateNotificationSettings} className="space-y-4 max-w-md">
        <div>
          <h2 className="text-sm font-medium">Email-нотифікації (Gmail)</h2>
          <p className="text-xs text-gray-500 mt-1">
            Надсилання листів поки не підключено — тут можна заздалегідь
            налаштувати, про що отримувати сповіщення.
          </p>
        </div>
        <div className="space-y-2">
          {fields.map((field) => (
            <label key={field} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={field}
                defaultChecked={settings?.[field] ?? true}
              />
              {NOTIFICATION_SETTINGS_LABELS[field]}
            </label>
          ))}
        </div>
        <SubmitButton
         
          className="rounded-md bg-blue-600 text-white text-sm px-4 py-2 hover:bg-blue-700"
        >
          Зберегти
        </SubmitButton>
      </form>
    </div>
  );
}
