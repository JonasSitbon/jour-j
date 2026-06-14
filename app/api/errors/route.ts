import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export const runtime = "nodejs";

type ErrorLevel = "info" | "warning" | "error" | "critical";

interface ErrorPayload {
  level: ErrorLevel;
  message: string;
  stack?: string;
  path?: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}

const ALERT_LEVELS: ErrorLevel[] = ["error", "critical"];

async function fireWebhook(payload: ErrorPayload) {
  const url = process.env.MONITORING_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app: "Jour J",
        environment: process.env.NODE_ENV ?? "production",
        level: payload.level,
        message: payload.message,
        path: payload.path ?? null,
        stack: payload.stack ?? null,
        timestamp: new Date().toISOString(),
        alert_email: process.env.MONITORING_ALERT_EMAIL ?? null,
        metadata: payload.metadata ?? {},
      }),
    });
  } catch {
    // webhook failure must never propagate
  }
}

export async function POST(req: NextRequest) {
  let body: ErrorPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { level = "error", message, stack, path, user_id, metadata } = body;
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  // Persist to Supabase (using anon client — RLS allows inserts from anyone)
  const c = createClient();
  await c.from("error_logs").insert({
    level,
    message: String(message).slice(0, 2000),
    stack: stack ? String(stack).slice(0, 5000) : null,
    path: path ? String(path).slice(0, 500) : null,
    user_id: user_id ?? null,
    metadata: metadata ?? {},
    notified: ALERT_LEVELS.includes(level),
  });

  // Fire webhook for error / critical levels
  if (ALERT_LEVELS.includes(level)) {
    await fireWebhook({ level, message, stack, path, metadata });
  }

  return NextResponse.json({ ok: true });
}
