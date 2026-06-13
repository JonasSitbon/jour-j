import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Inerte tant qu'aucun DSN n'est configuré (rien n'est envoyé).
// Session Replay volontairement non activé : trop lourd pour le bundle.
Sentry.init({
  dsn,
  enabled: !!dsn,
  // Échantillonnage des traces de performance (10% en prod)
  tracesSampleRate: 0.1,
});
