import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Reporte aussi vers notre propre DB + webhook pour les erreurs non-ignorées
    const err = hint.originalException;
    if (err instanceof Error && typeof window !== "undefined") {
      fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "error",
          message: err.message,
          stack: err.stack,
          path: window.location.pathname,
          metadata: { sentry_event_id: event.event_id },
        }),
      }).catch(() => {});
    }
    return event;
  },
});
