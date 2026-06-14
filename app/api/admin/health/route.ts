import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    resend:    !!process.env.RESEND_API_KEY,
    webhook:   !!process.env.MONITORING_WEBHOOK_URL,
    alertEmail: !!process.env.MONITORING_ALERT_EMAIL,
    sentry:    !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  });
}
