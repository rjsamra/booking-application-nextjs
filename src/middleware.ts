import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminUi = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  if (!isAdminUi && !isAdminApi) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("AUTH_SECRET is not set");
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Server misconfiguration." } },
      { status: 500 },
    );
  }

  const token = await getToken({
    req: request,
    secret,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const role = token?.role as string | undefined;

  if (!token) {
    if (isAdminApi) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
        { status: 401 },
      );
    }
    const login = new URL("/login", request.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  if (role !== "ADMIN") {
    if (isAdminApi) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Admin access required." } },
        { status: 403 },
      );
    }
    const login = new URL("/login", request.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
