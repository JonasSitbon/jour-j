"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="max-w-sm w-full text-center flex flex-col items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-coral-soft flex items-center justify-center">
          <Icon name="alert" size={26} className="text-coral" />
        </div>
        <div>
          <h1 className="text-xl font-semibold mb-2">Une erreur est survenue</h1>
          <p className="text-sm text-text-2 leading-relaxed">
            La page n&apos;a pas pu charger correctement. Vos données sont en sécurité.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg border border-line text-sm font-medium hover:bg-hover transition"
          >
            Réessayer
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
            style={{ background: "var(--primary)" }}
          >
            Tableau de bord
          </button>
        </div>
      </div>
    </div>
  );
}
