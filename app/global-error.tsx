"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif", background: "#F4ECDD", margin: 0 }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <div style={{ maxWidth: 420 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>😕</div>
            <h1 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 700, color: "#382F23" }}>Une erreur est survenue</h1>
            <p style={{ margin: "0 0 24px", color: "#9C8E76", fontSize: 15, lineHeight: 1.6 }}>
              Quelque chose s&apos;est mal passé de notre côté. Réessayez — si le problème persiste, rechargez la page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "12px 28px", background: "#C96E2C", color: "#FFFAF2", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            >
              Recharger
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
