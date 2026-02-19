import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = (session?.user as { role?: string })?.role;

  const isLoggedIn = !!session;

  if ((pathname === "/login" || pathname === "/register") && isLoggedIn) {
    const dest = role === "admin" ? "/admin" : "/athlete";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if ((pathname.startsWith("/admin") || pathname.startsWith("/athlete")) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/athlete", req.url));
  }

  if (pathname.startsWith("/athlete") && role !== "athlete") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/athlete/:path*", "/login", "/register"],
};
