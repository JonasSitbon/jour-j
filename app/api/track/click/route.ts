import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const url  = searchParams.get("url");
  const type = searchParams.get("t") ?? "unknown";

  if (!url) return NextResponse.redirect("https://the-cockpit.fr");

  // Log async, don't block the redirect
  const sb = createClient();
  void sb.from("analytics_events").insert({
    event_name: "email_link_clicked",
    metadata: { email_type: type, url },
  });

  return NextResponse.redirect(url);
}
