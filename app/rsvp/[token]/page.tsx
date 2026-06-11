"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

type RsvpStatus = "yes" | "pending" | "declined";
type Diet = "none" | "vegetarien" | "vegan" | "sans gluten" | "sans lactose";
type PageStatus = "loading" | "found" | "notfound" | "submitted" | "error";

interface GuestInfo {
  id: number;
  name: string;
  rsvp: RsvpStatus;
  diet: Diet;
  wedding_id: number;
}

interface WeddingInfo {
  id: number;
  partner_a: string;
  partner_b: string;
  date: string;
  venue: string;
  city: string;
}

const RSVP_OPTS: Array<{ value: RsvpStatus; icon: string; label: string; desc: string; color: string }> = [
  { value: "yes", icon: "🎉", label: "Oui, je serai là !", desc: "J'ai hâte de célébrer avec vous", color: "#7E9A63" },
  { value: "declined", icon: "😔", label: "Désolé(e), je ne pourrai pas", desc: "Je serai avec vous en pensée", color: "#C0533A" },
  { value: "pending", icon: "🤔", label: "Pas encore certain(e)", desc: "Je vous recontacterai dès que possible", color: "#B07A2C" },
];

const DIET_OPTS: Array<{ value: Diet; label: string }> = [
  { value: "none", label: "Standard (pas de restriction)" },
  { value: "vegetarien", label: "Végétarien" },
  { value: "vegan", label: "Vegan" },
  { value: "sans gluten", label: "Sans gluten" },
  { value: "sans lactose", label: "Sans lactose" },
];

function fmtDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function RsvpPage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<PageStatus>("loading");
  const [guest, setGuest] = useState<GuestInfo | null>(null);
  const [wedding, setWedding] = useState<WeddingInfo | null>(null);
  const [rsvp, setRsvp] = useState<RsvpStatus>("pending");
  const [diet, setDiet] = useState<Diet>("none");
  const [saving, setSaving] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function load() {
      const { data: guestData, error } = await supabase
        .from("guests")
        .select("id, name, rsvp, diet, wedding_id")
        .eq("rsvp_token", params.token)
        .single();

      if (error || !guestData) { setStatus("notfound"); return; }

      setGuest(guestData as GuestInfo);
      setRsvp(guestData.rsvp as RsvpStatus);
      setDiet(guestData.diet as Diet);

      const { data: wData } = await supabase
        .from("wedding")
        .select("id, partner_a, partner_b, date, venue, city")
        .eq("id", guestData.wedding_id)
        .single();

      if (wData) setWedding(wData as WeddingInfo);
      setStatus("found");
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  const submit = async () => {
    if (!guest) return;
    setSaving(true);
    const { error } = await supabase
      .from("guests")
      .update({ rsvp, diet })
      .eq("rsvp_token", params.token);
    setSaving(false);
    if (error) { setStatus("error"); return; }
    setStatus("submitted");
  };

  const selectedOpt = RSVP_OPTS.find((o) => o.value === rsvp);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#F4ECDD", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: "3px solid #C96E2C", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#9C8E76", fontSize: 14, fontFamily: "system-ui" }}>Chargement…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div style={{ minHeight: "100vh", background: "#F4ECDD", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "system-ui" }}>
        <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <h1 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 700, color: "#382F23" }}>Lien invalide</h1>
          <p style={{ margin: 0, color: "#9C8E76", fontSize: 15, lineHeight: 1.6 }}>Ce lien de réponse n'est pas valide ou a expiré. Contactez les mariés pour obtenir un nouveau lien.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ minHeight: "100vh", background: "#F4ECDD", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "system-ui" }}>
        <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 700, color: "#382F23" }}>Erreur</h1>
          <p style={{ margin: "0 0 20px", color: "#9C8E76", fontSize: 15, lineHeight: 1.6 }}>Une erreur est survenue. Réessayez dans quelques instants.</p>
          <button onClick={() => setStatus("found")} style={{ padding: "12px 28px", background: "#C96E2C", color: "#FFFAF2", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (status === "submitted") {
    return (
      <div style={{ minHeight: "100vh", background: "#F4ECDD", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "system-ui" }}>
        <div style={{ maxWidth: 480, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "inline-block", background: "#382F23", padding: "9px 22px", borderRadius: 12, color: "#F4ECDD", fontSize: 15, fontWeight: 800, letterSpacing: 4, textTransform: "lowercase", marginBottom: 24 }}>
              jour j
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", boxShadow: "0 4px 20px rgba(56,47,35,0.10)", textAlign: "center" }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>💌</div>
            <h1 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 700, color: "#382F23" }}>Réponse enregistrée !</h1>
            <p style={{ margin: "0 0 20px", color: "#6B5E49", fontSize: 15, lineHeight: 1.7 }}>
              Merci <strong style={{ color: "#382F23" }}>{guest?.name}</strong>, votre réponse a bien été transmise aux mariés.
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#FBF1E3", border: `2px solid ${selectedOpt?.color ?? "#C96E2C"}`, borderRadius: 12, padding: "12px 20px", marginBottom: 24 }}>
              <span style={{ fontSize: 22 }}>{selectedOpt?.icon}</span>
              <span style={{ fontWeight: 600, color: "#382F23", fontSize: 15 }}>{selectedOpt?.label}</span>
            </div>
            {wedding && (
              <div style={{ borderTop: "1px solid #F0E8DB", paddingTop: 20, marginTop: 4 }}>
                <p style={{ margin: "0 0 4px", fontSize: 13, color: "#9C8E76" }}>Mariage de</p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#382F23" }}>{wedding.partner_a} &amp; {wedding.partner_b}</p>
                {wedding.date && <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6B5E49" }}>{fmtDate(wedding.date)}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F4ECDD", padding: "40px 16px 64px", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-block", background: "#382F23", padding: "10px 24px", borderRadius: 13, color: "#F4ECDD", fontSize: 17, fontWeight: 800, letterSpacing: 5, textTransform: "lowercase" }}>
            jour j
          </div>
        </div>

        {/* Wedding header */}
        {wedding && (
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#9C8E76", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600 }}>Invitation au mariage de</p>
            <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: "#382F23" }}>
              {wedding.partner_a} &amp; {wedding.partner_b}
            </h1>
            {wedding.date && <p style={{ margin: "0 0 4px", fontSize: 15, color: "#6B5E49" }}>{fmtDate(wedding.date)}</p>}
            {wedding.venue && (
              <p style={{ margin: 0, fontSize: 14, color: "#9C8E76" }}>
                {wedding.venue}{wedding.city ? `, ${wedding.city}` : ""}
              </p>
            )}
          </div>
        )}

        {/* Main card */}
        <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 20px rgba(56,47,35,0.10)" }}>

          {/* Card header */}
          <div style={{ background: "#C96E2C", padding: "24px 32px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(255,250,242,0.7)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600 }}>Votre invitation</p>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#FFFAF2" }}>Bonjour {guest?.name} 👋</h2>
          </div>

          <div style={{ padding: "32px" }}>
            <p style={{ margin: "0 0 24px", fontSize: 15, color: "#6B5E49", lineHeight: 1.7 }}>
              Serez-vous parmi nous pour célébrer ce moment ?
            </p>

            {/* RSVP choices */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {RSVP_OPTS.map((opt) => {
                const isSelected = rsvp === opt.value;
                return (
                  <button key={opt.value} onClick={() => setRsvp(opt.value)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                      background: isSelected ? "#FBF1E3" : "#FAFAF8",
                      border: `2px solid ${isSelected ? opt.color : "#F0E8DB"}`,
                      borderRadius: 12, cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                    }}>
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#382F23", marginBottom: 2 }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: "#9C8E76" }}>{opt.desc}</div>
                    </div>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                      background: isSelected ? opt.color : "transparent",
                      border: `2px solid ${isSelected ? opt.color : "#D8D0C4"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isSelected && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dietary preference (only if confirmed yes) */}
            {rsvp === "yes" && (
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#382F23", marginBottom: 8 }}>
                  Régime alimentaire
                </label>
                <select value={diet} onChange={(e) => setDiet(e.target.value as Diet)}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 10,
                    border: "2px solid #F0E8DB", background: "#FAFAF8",
                    fontSize: 14, color: "#382F23", cursor: "pointer",
                    outline: "none", appearance: "none",
                  }}>
                  {DIET_OPTS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit */}
            <button onClick={submit} disabled={saving}
              style={{
                width: "100%", padding: "15px 24px", borderRadius: 12,
                background: saving ? "#D4A07A" : "#C96E2C",
                color: "#FFFAF2", border: "none", fontSize: 15, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer", letterSpacing: 0.3,
                transition: "background 0.15s",
              }}>
              {saving ? "Envoi en cours…" : "Confirmer ma réponse →"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: "#BBA98A", lineHeight: 1.6 }}>
          Vos informations seront uniquement partagées avec les mariés.<br />
          Powered by <strong>Jour J</strong>
        </p>
      </div>
    </div>
  );
}
