import { auth, signIn, testLoginEnabled } from "@/auth";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { SubmitButton } from "@/components/SubmitButton";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="flex justify-center pb-2">
            <Logo size="lg" />
            <span className="sr-only">Base Training App</span>
          </h1>
          <p className="text-gray-500 text-sm">Увійдіть, щоб продовжити</p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <SubmitButton
           
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-4 font-medium hover:bg-gray-50"
          >
            Увійти через Google
          </SubmitButton>
        </form>

        {testLoginEnabled && (
          <div className="border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-500 mb-2">
              Тестовий вхід (тільки для розробки)
            </p>
            <form
              action={async (formData: FormData) => {
                "use server";
                await signIn("test-login", {
                  email: formData.get("email"),
                  name: formData.get("name"),
                  redirectTo: "/",
                });
              }}
              className="space-y-2"
            >
              <input
                name="email"
                type="email"
                required
                placeholder="email@example.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                name="name"
                type="text"
                placeholder="Ім'я"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <SubmitButton
               
                className="w-full rounded-md bg-gray-800 text-white py-2 px-4 text-sm font-medium hover:bg-gray-700"
              >
                Увійти тестовим користувачем
              </SubmitButton>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
