"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { getInviteInfo, acceptWeddingInvite, setActiveWedding } from "@/lib/db";
import type { WeddingRole } from "@/lib/types";

type PageStatus = "loading" | "found" | "notfound" | "accepting" | "error";

interface InviteInfo {
  wedding: { partner_a: string; partner_b: string; date: string; city: string };
  role: WeddingRole;
  email: string | null;
  accepted: boolean;
  inviter: string | null;
}

const ROLE_LABELS: Record<WeddingRole, { label: string; desc: string }> = {
  owner:  { label: "Propriétaire",   desc: "Accès complet" },
  admin:  { label: "Administrateur", desc: "Peut inviter et modifier les paramètres" },
  editor: { label: "Éditeur",        desc: "Peut modifier les données du mariage" },
  viewer: { label: "Lecteur",        desc: "Accès en lecture seule" },
};

function fmtDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch { return iso; }
}

const S = {
  page:    { minHeight: "100vh", background: "#F4ECDD", padding: "40px 16px 64px", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif", display: "flex", alignItems: "center", justifyContent: "center" } as React.CSSProperties,
  wrap:    { maxWidth: 480, width: "100%" } as React.CSSProperties,
  card:    { background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(56,47,35,0.12)" } as React.CSSProperties,
  logoBox: { textAlign: "center" as const, marginBottom: 28 },
  logo:    { display: "inline-block", background: "#382F23", padding: "9px 22px", borderRadius: 12, color: "#F4ECDD", fontSize: 15, fontWeight: 800, letterSpacing: 4, textTransform: "lowercase" as const },
  btn:     { display: "block", width: "100%", padding: "14px 24px", borderRadius: 12, border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", textAlign: "center" as const, textDecoration: "none", boxSizing: "border-box" as const },
};

export default function InvitePage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<PageStatus>("loading");
  const [info, setInfo]     = useState<InviteInfo | null>(null);
  const [user, setUser]     = useState<{ email?: string } | null>(null);

  useEffect(() => {
    // Mémorise l'invitation : si la personne passe par signup/confirmation
    // email, on la ramène ici (cf. onboarding + providers)
    localStorage.setItem("jj_pending_invite", params.token);

    async function load() {
      const [invite, { data: { user: u } }] = await Promise.all([
        getInviteInfo(params.token),
        createClient().auth.getUser(),
      ]);
      if (!invite) {
        localStorage.removeItem("jj_pending_invite");
        setStatus("notfound");
        return;
      }
      setInfo(invite as InviteInfo);
      setUser(u);
      setStatus("found");
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  const accept = async () => {
    setStatus("accepting");
    const weddingId = await acceptWeddingInvite(params.token);
    if (!weddingId) { setStatus("error"); return; }
    localStorage.removeItem("jj_pending_invite");
    setActiveWedding(weddingId);
    window.location.href = "/dashboard";
  };

  if (status === "loading") {
    return (
      <div style={S.page}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: "3px solid #C96E2C", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#9C8E76", fontSize: 14 }}>Chargement…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div style={S.page}>
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <h1 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 700, color: "#382F23" }}>Invitation introuvable</h1>
          <p style={{ margin: 0, color: "#9C8E76", fontSize: 15, lineHeight: 1.6 }}>
            Ce lien d&apos;invitation n&apos;est pas valide ou a été révoqué. Demandez un nouveau lien à la personne qui vous a invité(e).
          </p>
        </div>
      </div>
    );
  }

  const i = info!;
  const roleMeta = ROLE_LABELS[i.role] ?? ROLE_LABELS.viewer;
  const loginUrl  = `/login?next=${encodeURIComponent(`/invite/${params.token}`)}`;

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={S.logoBox}>
          <span style={S.logo}>jour j</span>
        </div>

        <div style={S.card}>
          <div style={{ background: "#7E9A63", padding: "24px 32px" }}>
            <p style={{ margin: "0 0 3px", fontSize: 11, color: "rgba(255,250,242,0.7)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700 }}>
              Invitation à collaborer
            </p>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#FFFAF2" }}>
              Mariage de {i.wedding.partner_a} &amp; {i.wedding.partner_b}
            </h1>
          </div>

          <div style={{ padding: 32 }}>
            <p style={{ margin: "0 0 20px", fontSize: 15, color: "#6B5E49", lineHeight: 1.7 }}>
              {i.inviter ? <><strong style={{ color: "#382F23" }}>{i.inviter}</strong> vous invite</> : "Vous êtes invité(e)"} à
              rejoindre l&apos;organisation de ce mariage
              {i.wedding.date ? <> prévu le <strong style={{ color: "#382F23" }}>{fmtDate(i.wedding.date)}</strong></> : null}
              {i.wedding.city ? <> à {i.wedding.city}</> : null}.
            </p>

            <div style={{ background: "#FBF8F3", border: "1px solid #F0E8DB", borderRadius: 12, padding: "14px 18px", marginBottom: 24 }}>
              <p style={{ margin: "0 0 2px", fontSize: 12, color: "#9C8E76", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Votre rôle</p>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#382F23" }}>{roleMeta.label}</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6B5E49" }}>{roleMeta.desc}</p>
            </div>

            {i.accepted && (
              <div style={{ background: "#EFF4EA", border: "1px solid #C9D8BC", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#55703F" }}>✓ Cette invitation a déjà été acceptée.</p>
              </div>
            )}

            {status === "error" && (
              <div style={{ background: "#FBEAE5", border: "1px solid #EFC4B8", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#A8432E" }}>
                  Impossible d&apos;accepter cette invitation. Elle est peut-être liée à un autre compte — vérifiez que vous êtes connecté(e) avec la bonne adresse{i.email ? <> (<strong>{i.email}</strong>)</> : null}.
                </p>
              </div>
            )}

            {user ? (
              <button onClick={accept} disabled={status === "accepting"}
                style={{ ...S.btn, background: status === "accepting" ? "#A8BC93" : "#7E9A63", color: "#FFFAF2" }}>
                {status === "accepting" ? "Acceptation…" : i.accepted ? "Accéder au mariage →" : "Accepter l'invitation →"}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href={loginUrl} style={{ ...S.btn, background: "#7E9A63", color: "#FFFAF2" }}>
                  Se connecter pour accepter →
                </a>
                <a href="/signup" style={{ ...S.btn, background: "#FBF1E3", color: "#382F23", border: "2px solid #E8DCC8" }}>
                  Créer un compte
                </a>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#9C8E76", textAlign: "center", lineHeight: 1.6 }}>
                  Après inscription, vous serez ramené(e) sur cette invitation.
                </p>
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#BBA98A", lineHeight: 1.6 }}>
          Powered by <strong>Jour J</strong> — <a href="https://the-cockpit.fr" style={{ color: "#BBA98A" }}>the-cockpit.fr</a>
        </p>
      </div>
    </div>
  );
}
