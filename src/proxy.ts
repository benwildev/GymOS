import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/register", "/forgot-password"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  if (isPublicRoute) {
    if (isLoggedIn) {
      if (req.auth?.user?.role === "OWNER") {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
      }
      return NextResponse.redirect(new URL("/member", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn) {
    const role = req.auth?.user?.role;
    const isOwnerRoute = nextUrl.pathname.startsWith("/dashboard");
    const isMemberRoute = nextUrl.pathname.startsWith("/member");

    if (isOwnerRoute && role !== "OWNER") {
      return NextResponse.redirect(new URL("/member", nextUrl));
    }

    if (isMemberRoute && role !== "MEMBER") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
