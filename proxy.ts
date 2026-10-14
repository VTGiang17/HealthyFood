import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "accessToken";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/admin-login", request.url);

    loginUrl.searchParams.set("next", pathname + search);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
