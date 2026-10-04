import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/jwt";

// User protected route prefixes
const USER_PROTECTED_ROUTES = [
  "/dashboard",
  "/expenses",
  "/contract-expenses",
  "/materials",
  "/labour",
  "/suppliers",
  "/stages",
  "/reports",
  "/house",
  "/profile",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const user = await getUserFromRequest(req);

  // 1. Admin Protected Routes (All /admin routes except /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!user) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      return res;
    }

    if (user.role !== "ADMIN") {
      // User is logged in, but not an admin -> redirect to user dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    return res;
  }

  // 2. Admin Login Page (/admin/login)
  if (pathname === "/admin/login") {
    if (user && user.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // 3. User Protected Routes (/dashboard, /expenses, /contract-expenses, etc.)
  const isUserProtected = USER_PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isUserProtected) {
    if (!user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      return res;
    }
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    return res;
  }

  // 4. Auth Pages (/login, /register)
  if (pathname === "/login" || pathname === "/register") {
    if (user) {
      if (user.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/expenses/:path*",
    "/contract-expenses/:path*",
    "/materials/:path*",
    "/labour/:path*",
    "/suppliers/:path*",
    "/stages/:path*",
    "/reports/:path*",
    "/house/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
