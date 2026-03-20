import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === "/signin") {
    return NextResponse.next();
  }

  // Allow NextAuth routes through.
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });
  if (token) {
    return NextResponse.next();
  }

  const signInUrl = request.nextUrl.clone();
  signInUrl.pathname = "/signin";
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    // Match all request paths except for:
    // - next internals
    // - static files
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
