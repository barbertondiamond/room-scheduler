import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/unlock") {
      return NextResponse.next();
    }

    const adminAccess = request.cookies.get("admin_access")?.value;

    if (adminAccess !== "granted") {
      const unlockUrl = new URL("/admin/unlock", request.url);
      unlockUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(unlockUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
