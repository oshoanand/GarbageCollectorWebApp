import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (your public images folder)
     * - icons (if you have one)
     * - public (if you have one)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons|public).*)",
  ],
};
