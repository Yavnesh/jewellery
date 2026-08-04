import { withAuth } from "next-auth/middleware";
import { NextResponse, NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 10 requests per 10 seconds
// Fallback gracefully if Upstash credentials are not provided (e.g. local dev)
const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, "10 s"),
        analytics: true,
      })
    : null;

export default withAuth(
  async function middleware(req: NextRequest & { nextauth: any }) {
    const ip = (req as any).ip ?? req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const path = req.nextUrl.pathname;

    // 1. Rate Limiting for critical routes (checkout, auth, search)
    if (ratelimit) {
      if (
        path.startsWith("/checkout") ||
        path.startsWith("/api/checkout") ||
        path.startsWith("/api/auth") ||
        path.startsWith("/search")
      ) {
        const { success, pending, limit, reset, remaining } = await ratelimit.limit(
          `ratelimit_${ip}`
        );
        if (!success) {
          return new NextResponse("Too Many Requests", {
            status: 429,
            headers: {
              "Retry-After": reset.toString(),
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            },
          });
        }
      }
    }

    // 2. Add x-invoke-path for Pino correlation logging
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-invoke-path", path);

    // 3. Admin Authorization
    if (path.startsWith("/admin")) {
      if (req.nextauth?.token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Admin routes require admin token
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return !!token && token.role === "admin";
        }
        return true; // We let middleware handle other authorization and rate-limiting
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*", 
    "/checkout/:path*", 
    "/api/checkout/:path*", 
    "/api/auth/:path*",
    "/search/:path*"
  ],
};
