import { NextResponse } from "next/server";

/**
 * Validates that an incoming background request carries a valid CRON_SECRET bearer token.
 * Prevents unauthorized public execution of reconciliation and processing daemon routes.
 */
export function verifyCronSecret(request: Request): { authorized: boolean; response?: NextResponse } {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In production, CRON_SECRET must be configured and match the Authorization header
  if (process.env.NODE_ENV === "production" || cronSecret) {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Unauthorized: Invalid or missing cron secret authorization" },
          { status: 401 }
        ),
      };
    }
  }

  return { authorized: true };
}
