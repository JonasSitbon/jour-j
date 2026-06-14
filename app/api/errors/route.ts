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

const LEVEL_EMOJI: Record<ErrorLevel, string> = {
  info:     "ℹ️",
  warning:  "⚠️",
  error:    "🔴",
  critical: "🚨",
};

async function sendAlertEmail(payload: ErrorPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const to     = process.env.MONITORING_ALERT_EMAIL;
  if (!apiKey || !to) return;

  const env   = process.env.NODE_ENV ?? "production";
  const emoji = LEVEL_EMOJI[payload.level];
  const ts    = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#f4f4f5;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
      <tr>
        <td style="background:#1C1208;border-radius:10px 10px 0 0;padding:20px 32px;">
          <span style="font-size:18px;font-weight:700;color:#FFFAF2;">Jour J — Alerte monitoring</span>
        </td>
      </tr>
      <tr>
        <td style="background:#fff;padding:28px 32px;border-left:1px solid #e4e4e7;border-right:1px solid #e4e4e7;">
          <p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#18181b;">
            ${emoji} Erreur ${payload.level.toUpperCase()} détectée
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;margin-bottom:20px;">
            <tr><td style="padding:10px 14px;background:#fafafa;border-bottom:1px solid #e4e4e7;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.05em;">Niveau</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e4e4e7;font-size:13px;font-weight:700;color:${payload.level === "critical" ? "#dc2626" : "#ea580c"};">${payload.level.toUpperCase()}</td></tr>
            <tr><td style="padding:10px 14px;background:#fafafa;border-bottom:1px solid #e4e4e7;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.05em;">Message</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e4e4e7;font-size:13px;color:#18181b;font-family:monospace;">${payload.message.replace(/</g, "&lt;")}</td></tr>
            ${payload.path ? `<tr><td style="padding:10px 14px;background:#fafafa;border-bottom:1px solid #e4e4e7;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.05em;">Page</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e4e4e7;font-size:13px;color:#18181b;font-family:monospace;">${payload.path}</td></tr>` : ""}
            <tr><td style="padding:10px 14px;background:#fafafa;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.05em;">Environnement</td>
                <td style="padding:10px 14px;font-size:13px;color:#18181b;">${env} · ${ts}</td></tr>
          </table>
          ${payload.stack ? `
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.05em;">Stack trace</p>
          <pre style="margin:0;padding:14px;background:#18181b;border-radius:8px;font-size:11px;color:#d1d5db;overflow:auto;max-height:200px;white-space:pre-wrap;">${payload.stack.slice(0, 2000).replace(/</g, "&lt;")}</pre>
          ` : ""}
        </td>
      </tr>
      <tr>
        <td style="background:#fafafa;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 10px 10px;padding:14px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#a1a1aa;">Jour J · Alerte automatique — voir <a href="https://jour-j.fr/admin/logs" style="color:#C96E2C;">le dashboard</a></p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Jour J Monitoring <monitoring@jour-j.fr>",
        to: [to],
        subject: `${emoji} [Jour J] Erreur ${payload.level.toUpperCase()}${payload.path ? ` sur ${payload.path}` : ""}`,
        html,
      }),
    });
  } catch {
    // email failure must never propagate
  }
}

// Kept as optional fallback if MONITORING_WEBHOOK_URL is also set
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
    // silent
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

  // Fire email alert + optional webhook for error / critical levels
  if (ALERT_LEVELS.includes(level)) {
    await Promise.all([
      sendAlertEmail({ level, message, stack, path, metadata }),
      fireWebhook({ level, message, stack, path, metadata }),
    ]);
  }

  return NextResponse.json({ ok: true });
}
