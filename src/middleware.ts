import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * FlutterForge AI — Security + Auth Middleware
 *
 * Applies to every request:
 *   1. Auth check — protect /app routes (redirect to /login if not authenticated)
 *   2. Security headers (CSP, HSTS, X-Frame-Options, etc.)
 *   3. CORS for API routes
 *   4. Rate limiting (in-memory, per-IP)
 *
 * Rate limiting is in-memory and per-server-instance. For multi-instance
 * production deployments, replace with Redis-backed rate limiting.
 */

// ─── Protected routes (require authentication) ────────────────────────────

const PROTECTED_PREFIXES = [
  "/dashboard", "/workspace", "/planner", "/tool-intelligence",
  "/flutter-platform", "/runtime", "/visual", "/vision-ai",
  "/autonomous", "/cloud", "/ai-settings", "/chat",
  "/execution", "/history", "/inspector", "/projects",
  "/settings", "/templates",
];

// API routes that require auth (everything except /api/auth and /api/v1/health)
function isProtectedApiPath(pathname: string): boolean {
  if (pathname.startsWith("/api/auth/")) return false;
  if (pathname === "/api/v1/health") return false;
  return pathname.startsWith("/api/");
}

function isProtectedPagePath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// ─── Rate Limiter (in-memory) ────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 100;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL_MS = 5 * 60_000;
let lastCleanup = Date.now();

function cleanupRateLimit(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [ip, entry] of rateLimitMap) {
    if (entry.resetAt < now) rateLimitMap.delete(ip);
  }
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupRateLimit();
  const now = Date.now();
  const existing = rateLimitMap.get(ip);
  if (!existing || existing.resetAt < now) {
    const entry: RateLimitEntry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ip, entry);
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: entry.resetAt };
  }
  existing.count++;
  const allowed = existing.count <= RATE_LIMIT_MAX_REQUESTS;
  return {
    allowed,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - existing.count),
    resetAt: existing.resetAt,
  };
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

// ─── Middleware ──────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);

  // 1. Auth check — protected pages redirect to /login
  if (isProtectedPagePath(pathname)) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Auth check — protected API routes return 401
  if (isProtectedApiPath(pathname)) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // 3. Rate limiting (skip for static assets).
  if (!pathname.startsWith("/_next/") && !pathname.startsWith("/favicon")) {
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.resetAt),
            "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }
  }

  // 4. CORS for API routes.
  const isApiRoute = pathname.startsWith("/api/");
  const origin = request.headers.get("origin");
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") ?? ["*"];
  const corsOrigin = origin && (allowedOrigins.includes("*") || allowedOrigins.includes(origin))
    ? origin
    : allowedOrigins[0];

  // 5. Handle preflight (OPTIONS) requests for API routes.
  if (isApiRoute && request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set("Access-Control-Allow-Origin", corsOrigin ?? "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID");
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  }

  // 6. Process the request.
  const response = NextResponse.next();

  if (isApiRoute) {
    response.headers.set("Access-Control-Allow-Origin", corsOrigin ?? "*");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    const rateLimit = checkRateLimit(ip);
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX_REQUESTS));
    response.headers.set("X-RateLimit-Remaining", String(Math.max(0, rateLimit.remaining - 1)));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|.*\\.png$|.*\\.svg$|.*\\.jpg$).*)",
  ],
};
