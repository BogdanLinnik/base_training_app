import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Тренування</h1>
          <p className="text-gray-500 text-sm">Увійдіть, щоб продовжити</p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-4 font-medium hover:bg-gray-50"
          >
            Увійти через Google
          </button>
        </form>
      </div>
    </div>
  );
}
