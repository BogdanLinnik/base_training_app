import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const providers: Provider[] = [
  Google({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
  }),
];

// Дозволяє логінитись без реального Google OAuth — лише для локальної
// розробки й тестів. Ніколи не вмикати цю змінну на проді (Vercel).
export const testLoginEnabled = process.env.ALLOW_TEST_LOGIN === "true";

if (testLoginEnabled) {
  providers.push(
    Credentials({
      id: "test-login",
      name: "Тестовий вхід",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Ім'я", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        if (!email) return null;
        const name = (credentials?.name as string | undefined) || email.split("@")[0];
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, name },
        });
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers,
  pages: { signIn: "/login" },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
  },
});
