import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import logger from "@/lib/logger";

const isProd = process.env.NODE_ENV === "production";

const rawJwtSecret =
  process.env.JWT_SECRET ||
  (!isProd ? "dev-only-fallback-secret-at-least-32-chars-long" : undefined);

if (!rawJwtSecret) {
  throw new Error(
    "JWT_SECRET is not set. Please configure it in the environment variables."
  );
}

const JWT_SECRET = new TextEncoder().encode(rawJwtSecret);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 排除不需要验证的路径
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. 检查 Cookie 中的 Token
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 3. 验证 Token
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    logger.error({ err: error }, "Middleware - JWT verification failed");
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

// 匹配所有路径，除了特定的排除项
export const config = {
  matcher: "/((?!api/auth/login|_next/static|_next/image|favicon.ico).*)",
};
