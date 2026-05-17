import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/studio", "/api/artifacts", "/api/evidence-map"];

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

export function middleware(request: NextRequest) {
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
  matcher: ["/studio/:path*", "/api/artifacts/:path*", "/api/evidence-map/:path*"]
};
