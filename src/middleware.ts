// import { withAuth } from "next-auth/middleware";
// export default withAuth({
//   pages: {
//     signIn: "/login",
//   },
// });

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - images, icons, public (assets)
//      * - login (public login page)
//      * - register (public registration page)
//      * - reset-password (public password reset page)
//      */

//     "/((?!api|_next/static|_next/image|favicon.ico|images|icons|public|login|register|reset-password|firebase-messaging-sw.js|manifest.json).*)",
//   ],
// };

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Define Routes
  const authRoutes = ["/login", "/register", "/reset-password"];
  const visitorRoutes = ["/visitor"];
  const collectorRoutes = ["/collector"];

  // 2. Get the User's Token (Session)
  const token = await getToken({ req });
  const isAuth = !!token;
  const userRole = token?.role as string | undefined; // "VISITOR" or "COLLECTOR"

  // --- SCENARIO 1: User is Logged In but tries to access Login/Register ---
  if (isAuth && authRoutes.some((route) => pathname.startsWith(route))) {
    if (userRole === "COLLECTOR") {
      return NextResponse.redirect(new URL("/collector", req.url));
    } else {
      // Default to VISITOR for safety
      return NextResponse.redirect(new URL("/visitor", req.url));
    }
  }

  // --- SCENARIO 2: User is NOT Logged In but tries to access Protected Routes ---
  if (
    !isAuth &&
    (visitorRoutes.some((r) => pathname.startsWith(r)) ||
      collectorRoutes.some((r) => pathname.startsWith(r)))
  ) {
    // Redirect to login with a callback URL so they go back after logging in
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // --- SCENARIO 3: Role Protection (e.g., Visitor tries to access /collector) ---
  if (isAuth) {
    if (
      userRole === "VISITOR" &&
      collectorRoutes.some((r) => pathname.startsWith(r))
    ) {
      // Kick them back to their own dashboard
      return NextResponse.redirect(new URL("/visitor", req.url));
    }

    if (
      userRole === "COLLECTOR" &&
      visitorRoutes.some((r) => pathname.startsWith(r))
    ) {
      // Kick them back to their own dashboard
      return NextResponse.redirect(new URL("/collector", req.url));
    }
  }

  return NextResponse.next();
}

// Configuration: Define which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons, public (assets)
     * - firebase-messaging-sw.js (Service Worker - CRITICAL to exclude)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons|public|login|register|reset-password|firebase-messaging-sw.js|manifest.json).*)",
  ],
};
