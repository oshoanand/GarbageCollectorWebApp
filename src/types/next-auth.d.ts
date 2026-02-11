// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extends the built-in session user type
   */
  interface Session {
    accessToken: string;
    user: {
      id: string;
      name: string;
      mobile: string;
      image?: string | null;
      email?: string | null;
      userType: string;
    };
  }

  /**
   * Extends the built-in user type
   */
  interface User {
    id: string;
    name: string;
    mobile: string;
    image?: string | null;
    email?: string | null;
    userType: string;
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extends the built-in JWT type
   */
  interface JWT {
    id: string;
    userType: string;
    name: string;
    mobile: string;
    image?: string | null;
    email?: string | null;
    accessToken: string;
  }
}
