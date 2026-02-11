import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/utils/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        mobile: { label: "Mobile", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },

      async authorize(credentials) {
        try {
          // 1. Validate inputs
          if (
            !credentials?.mobile ||
            !credentials?.password ||
            !credentials?.role
          ) {
            throw new Error("Mobile, Password, and Role are required");
          }

          // 2. Find user in database by MOBILE only
          const user = await prisma.user.findUnique({
            where: {
              mobile: credentials.mobile,
            },
          });

          // 3. Verify user exists
          if (!user || !user.password) {
            throw new Error("Неверный номер телефона или пароль");
          }

          // 4. Verify Role Matches
          if (user.userRole !== credentials.role) {
            throw new Error(
              `Аккаунт не зарегистрирован как ${credentials.role}`,
            );
          }

          // 5. Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password,
          );

          if (!isValidPassword) {
            throw new Error("Неверный пароль");
          }

          // 6. Generate Custom Token
          const secret = process.env.NEXTAUTH_SECRET!;
          const token = jwt.sign(
            {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.userRole,
              iat: Date.now() / 1000,
              exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            },
            secret,
            { algorithm: "HS256" },
          );

          // 7. Return User Object
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            mobile: user.mobile,
            role: user.userRole,
            accessToken: token,
          };
        } catch (error: any) {
          throw new Error(error.message);
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // UPDATED JWT CALLBACK
    async jwt({ token, user, trigger, session }) {
      // 1. Initial Sign In
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.mobile = (user as any).mobile;
        token.accessToken = (user as any).accessToken;
        token.image = user.image;
        token.name = user.name;
      }

      // 2. Handle Session Updates (e.g., name/image change)
      if (trigger === "update" && session) {
        // If the update call contained a name, update the token
        if (session.name) {
          token.name = session.name;
        }
        // If the update call contained an image, update the token
        if (session.image) {
          token.image = session.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.image = token.image as string | null | undefined;
        session.user.name = token.name;
        session.user.email = token.email;

        // Pass custom fields to the client
        (session.user as any).role = token.role;
        (session.user as any).mobile = token.mobile;
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
