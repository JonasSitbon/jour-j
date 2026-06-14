import { createClient } from "./supabase";

export type AnalyticsEventName =
  | "signup_complete"
  | "login"
  | "logout"
  | "password_reset_request"
  | "cta_click"
  | "pricing_view"
  | "trial_banner_click";

export async function track(
  event: AnalyticsEventName,
  metadata?: Record<string, unknown>
) {
  try {
    const c = createClient();
    const { data: { user } } = await c.auth.getUser();
    await c.from("analytics_events").insert({
      event_name: event,
      user_id: user?.id ?? null,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      metadata: metadata ?? {},
    });
  } catch {
    // silent — analytics must never break the app
  }
}
