import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/profile", "/projects", "/studio", "/builder", "/preview", "/templates", "/publish", "/references", "/api"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function unauthorized() {
  return new NextResponse("Auto-CaseStudy studio access required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Auto-CaseStudy Studio"'
    }
  });
}

export function proxy(request: NextRequest) {
  const studioPassword = process.env.AUTOCASESTUDY_STUDIO_PASSWORD;
  if (!studioPassword || !isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) {
    return unauthorized();
  }

  try {
    const decoded = atob(authorization.slice("Basic ".length));
    const password = decoded.split(":").slice(1).join(":");
    return password === studioPassword ? NextResponse.next() : unauthorized();
  } catch {
    return unauthorized();
  }
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/projects/:path*",
    "/studio/:path*",
    "/builder/:path*",
    "/preview/:path*",
    "/templates/:path*",
    "/publish/:path*",
    "/references/:path*",
    "/api/:path*"
  ]
};
