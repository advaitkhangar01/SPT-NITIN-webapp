import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const ipLimit = checkRateLimit(`login_ip_${ip}`, { windowMs: 15 * 60 * 1000, max: 20 });
    if (!ipLimit.success) {
      return NextResponse.json(
        { error: "Too many login attempts from this network. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipLimit.resetInSec) } }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password || typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const normalizedUsername = username.trim().toLowerCase();
    const userLimit = checkRateLimit(`login_user_${normalizedUsername}`, { windowMs: 15 * 60 * 1000, max: 8 });
    if (!userLimit.success) {
      return NextResponse.json(
        { error: "Account login temporarily locked due to multiple failed attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(userLimit.resetInSec) } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Reset rate limit on successful authentication
    resetRateLimit(`login_ip_${ip}`);
    resetRateLimit(`login_user_${normalizedUsername}`);

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
