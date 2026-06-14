type ErrorLevel = "info" | "warning" | "error" | "critical";

interface CaptureOptions {
  level?: ErrorLevel;
  path?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Envoie une erreur à l'API /api/errors (stockée en DB + webhook si critique).
 * Silencieux en cas d'échec réseau — n'interrompt jamais l'application.
 */
export async function captureError(
  error: unknown,
  options: CaptureOptions = {}
) {
  const { level = "error", path, metadata } = options;

  const err = error instanceof Error ? error : new Error(String(error));

  try {
    let userId: string | undefined;
    if (typeof window !== "undefined") {
      // Lazy-import to avoid SSR issues
      const { createClient } = await import("./supabase");
      const { data: { user } } = await createClient().auth.getUser();
      userId = user?.id;
    }

    await fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level,
        message: err.message,
        stack: err.stack,
        path: path ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
        user_id: userId,
        metadata,
      }),
    });
  } catch {
    // silent — error capture must never throw
  }
}
