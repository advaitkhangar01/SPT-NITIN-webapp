import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is missing in production!");
    }
    return new TextEncoder().encode("shashikala-power-tech-dev-secret-key-32chars-min");
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static assets, public files, and login endpoint
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/login" ||
    pathname === "/api/auth/login" ||
    pathname === "/logo.png" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("spt_session")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const jwtSecret = getJwtSecret();
    const { payload } = await jwtVerify(token, jwtSecret);
    const session = payload as any;

    // Check if user must change password
    if (session.mustChangePassword) {
      if (
        pathname === "/change-password" ||
        pathname === "/api/auth/change-password" ||
        pathname === "/api/auth/logout"
      ) {
        return NextResponse.next();
      }
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Password change required before accessing this endpoint" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/change-password", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png).*)",
  ],
};
