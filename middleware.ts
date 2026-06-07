import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/admin-auth";

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/api/admin/auth", "/api/admin/logout"]);

function isProtectedPath(pathname: string): boolean {
  if (PUBLIC_ADMIN_PATHS.has(pathname)) return false;

  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/api/admin")) return true;
  if (pathname === "/api/quizzes/import") return true;
  if (/^\/api\/quizzes\/[^/]+\/submissions(\/[^/]+)?$/.test(pathname)) return true;

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const authenticated = await verifySessionToken(token);

  if (authenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("returnUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/quizzes/import",
    "/api/quizzes/:slug/submissions",
    "/api/quizzes/:slug/submissions/:id",
  ],
};
