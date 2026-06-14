import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export const runtime = "nodejs";

// 1×1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("t") ?? "unknown";

  // Log async, don't block the pixel response
  const sb = createClient();
  void sb.from("analytics_events").insert({
    event_name: "email_opened",
    metadata: { email_type: type },
  });

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
    },
  });
}
