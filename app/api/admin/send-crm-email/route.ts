import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await sb.from("profiles").select("account_type").eq("id", user.id).single();
  if (me?.account_type !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    to_email: string;
    to_name: string;
    to_user_id: string;
    subject: string;
    body_html: string;
    template_id?: string;
  };

  const { to_email, to_name, to_user_id, subject, body_html } = body;
  if (!to_email || !subject || !body_html) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Resend not configured" }, { status: 500 });

  const from = `Jour J <hello@the-cockpit.fr>`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#f8f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#1a1a2e;">
        Jour <strong style="color:#C96E2C;">J</strong>
      </span>
    </div>
    <div style="background:#fff;border-radius:16px;padding:36px;border:1px solid #ede8e0;">
      ${body_html}
    </div>
    <div style="text-align:center;margin-top:28px;font-size:12px;color:#9ca3af;">
      Jour J · The Cockpit · <a href="https://the-cockpit.fr" style="color:#C96E2C;text-decoration:none;">the-cockpit.fr</a>
    </div>
  </div>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [`${to_name} <${to_email}>`], subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 502 });
  }

  const result = await res.json() as { id?: string };

  // Log in crm_events
  void sb.from("crm_events").insert({
    user_id: to_user_id,
    event_type: "email_sent",
    title: `Email envoyé : ${subject}`,
    description: `Destinataire : ${to_email}`,
    metadata: { resend_id: result.id, subject, template_id: body.template_id ?? null },
    performed_by: user.id,
  });

  return NextResponse.json({ ok: true, id: result.id });
}
