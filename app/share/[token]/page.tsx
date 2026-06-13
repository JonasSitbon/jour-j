"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

type PageStatus = "loading" | "found" | "notfound";

interface SharedWedding {
  partner_a: string;
  partner_b: string;
  date: string;
  venue: string;
  city: string;
  theme: string;
  guest_target: number;
}

interface SharedGuest {
  id: number;
  name: string;
  rsvp: "yes" | "pending" | "declined";
  side: "A" | "B";
  diet: string;
}

interface SharedVendor {
  id: number;
  cat: string;
  name: string;
  status: "signed" | "pending" | "declined";
  total: number;
}

interface SharedTask {
  id: number;
  title: string;
  cat: string;
  due: string;
  done: boolean;
  who: string;
}

interface SharedCeremonyEvent {
  id: number;
  order_idx: number;
  category: string;
  title: string;
  duration_min: number;
  who: string;
  music: string;
}

function fmtDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch { return iso; }
}

function daysUntil(iso: string): number {
  if (!iso) return 0;
  const d = new Date(iso + "T00:00:00");
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function fmtEur(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
}

function fmtRelDate(iso: string): string {
  if (!iso) return "";
  const d = daysUntil(iso);
  if (d < 0) return `il y a ${Math.abs(d)} j`;
  if (d === 0) return "aujourd'hui";
  if (d === 1) return "demain";
  return `dans ${d} j`;
}

export default function SharePage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<PageStatus>("loading");
  const [wedding, setWedding] = useState<SharedWedding | null>(null);
  const [guests, setGuests] = useState<SharedGuest[]>([]);
  const [vendors, setVendors] = useState<SharedVendor[]>([]);
  const [tasks, setTasks] = useState<SharedTask[]>([]);
  const [ceremony, setCeremony] = useState<SharedCeremonyEvent[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function load() {
      // RPC sécurisée : ne renvoie que le mariage correspondant au token exact
      const { data, error } = await supabase.rpc("get_share_data", { p_token: params.token });

      if (error || !data?.wedding) { setStatus("notfound"); return; }

      setWedding(data.wedding as SharedWedding);
      setGuests((data.guests ?? []) as SharedGuest[]);
      setVendors((data.vendors ?? []) as SharedVendor[]);
      setTasks((data.tasks ?? []) as SharedTask[]);
      setCeremony((data.ceremony ?? []) as SharedCeremonyEvent[]);
      setStatus("found");
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#F4ECDD", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, border: "3px solid #C96E2C", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div style={{ minHeight: "100vh", background: "#F4ECDD", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "system-ui" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
          <h1 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 700, color: "#382F23" }}>Lien invalide</h1>
          <p style={{ color: "#9C8E76", fontSize: 15, lineHeight: 1.6 }}>Ce lien de partage n'existe pas ou a été révoqué.</p>
        </div>
      </div>
    );
  }

  const w = wedding!;
  const confirmed = guests.filter(g => g.rsvp === "yes").length;
  const pending = guests.filter(g => g.rsvp === "pending").length;
  const declined = guests.filter(g => g.rsvp === "declined").length;
  const signedVendors = vendors.filter(v => v.status === "signed");
  const pendingVendors = vendors.filter(v => v.status === "pending");
  const totalVendorCost = signedVendors.reduce((s, v) => s + v.total, 0);
  const doneTasks = tasks.filter(t => t.done).length;
  const upcomingTasks = tasks.filter(t => !t.done).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6);
  const days = daysUntil(w.date);
  const pctTasks = tasks.length ? Math.round(doneTasks / tasks.length * 100) : 0;

  const statBox = (val: string | number, label: string, color: string) => (
    <div key={label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #EDE6DA", textAlign: "center" }}>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 12, color: "#9C8E76", marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F4ECDD", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" }}>

      {/* Hero header */}
      <div style={{ background: "linear-gradient(135deg, #4A3320 0%, #6E4423 60%, #C96E2C 100%)", padding: "48px 24px 56px", color: "#F4ECDD", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(244,236,221,0.15)", padding: "8px 20px", borderRadius: 10, fontSize: 12, fontWeight: 700, letterSpacing: 4, textTransform: "lowercase", marginBottom: 24 }}>
          jour j
        </div>
        <h1 style={{ margin: "0 0 10px", fontSize: 32, fontWeight: 800, letterSpacing: -0.5 }}>
          {w.partner_a} &amp; {w.partner_b}
        </h1>
        {w.date && (
          <p style={{ margin: "0 0 6px", fontSize: 15, opacity: 0.9 }}>{fmtDate(w.date)}</p>
        )}
        {w.venue && (
          <p style={{ margin: "0 0 20px", fontSize: 14, opacity: 0.75 }}>
            {w.venue}{w.city ? `, ${w.city}` : ""}
          </p>
        )}
        {w.date && (
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: 6, background: "rgba(244,236,221,0.15)", borderRadius: 12, padding: "10px 24px" }}>
            {days > 0 ? (
              <>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, opacity: 0.8, textTransform: "uppercase" }}>J —</span>
                <span style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>{days}</span>
                <span style={{ fontSize: 13, opacity: 0.8 }}>jours</span>
              </>
            ) : days === 0 ? (
              <span style={{ fontSize: 18, fontWeight: 700 }}>C'est aujourd'hui !</span>
            ) : (
              <span style={{ fontSize: 15, opacity: 0.9 }}>Le grand jour est passé</span>
            )}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px 64px" }}>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 32 }}>
          {statBox(confirmed, "Invités confirmés", "#7E9A63")}
          {statBox(pending, "En attente RSVP", "#B07A2C")}
          {statBox(signedVendors.length, "Prestataires signés", "#C96E2C")}
          {statBox(`${pctTasks}%`, "Checklist complète", "#382F23")}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Invités */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #EDE6DA" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FBF1E3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👥</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#382F23" }}>Invités</div>
                <div style={{ fontSize: 12, color: "#9C8E76" }}>{guests.length} personnes</div>
              </div>
            </div>
            {[
              { label: "Confirmés", count: confirmed, color: "#7E9A63", bg: "#EAF0DD" },
              { label: "En attente", count: pending, color: "#B07A2C", bg: "#FDF5E6" },
              { label: "Déclinés", count: declined, color: "#C0533A", bg: "#F8E2D9" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: "#6B5E49" }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{row.count}</span>
                  </div>
                  <div style={{ height: 5, background: "#F0EAE0", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: guests.length ? `${row.count / guests.length * 100}%` : "0%", background: row.color, borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                </div>
              </div>
            ))}
            {w.guest_target > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F0EAE0", fontSize: 12, color: "#9C8E76" }}>
                Objectif : {w.guest_target} personnes
              </div>
            )}
          </div>

          {/* Prestataires */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #EDE6DA" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FBF1E3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📋</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#382F23" }}>Prestataires</div>
                <div style={{ fontSize: 12, color: "#9C8E76" }}>{totalVendorCost > 0 ? fmtEur(totalVendorCost) + " engagés" : `${vendors.length} en cours`}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
              {signedVendors.map(v => (
                <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#EAF0DD", borderRadius: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7E9A63", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: "#382F23", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</span>
                  <span style={{ fontSize: 11, color: "#7E9A63", fontWeight: 600 }}>Signé</span>
                </div>
              ))}
              {pendingVendors.map(v => (
                <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#FDF5E6", borderRadius: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#B07A2C", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12.5, color: "#6B5E49", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</span>
                  <span style={{ fontSize: 11, color: "#B07A2C" }}>En cours</span>
                </div>
              ))}
              {vendors.length === 0 && <div style={{ fontSize: 12.5, color: "#9C8E76", textAlign: "center", padding: "12px 0" }}>Aucun prestataire</div>}
            </div>
          </div>

          {/* Checklist prochaines tâches */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #EDE6DA", gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FBF1E3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✅</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#382F23" }}>Checklist</div>
                <div style={{ fontSize: 12, color: "#9C8E76" }}>{doneTasks}/{tasks.length} tâches complétées</div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "#C96E2C" }}>{pctTasks}%</div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 6, background: "#F0EAE0", borderRadius: 3, marginBottom: 16, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pctTasks}%`, background: "linear-gradient(90deg, #C96E2C, #E2A05A)", borderRadius: 3, transition: "width 0.5s" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
              {upcomingTasks.map(t => {
                const isLate = daysUntil(t.due) < 0;
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 10, background: isLate ? "#F8E2D9" : "#FAFAF8", border: `1px solid ${isLate ? "#E8C4B8" : "#F0EAE0"}` }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${isLate ? "#C0533A" : "#D8D0C4"}`, flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#382F23", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: isLate ? "#C0533A" : "#9C8E76", marginTop: 2 }}>{fmtRelDate(t.due)}</div>
                    </div>
                  </div>
                );
              })}
              {upcomingTasks.length === 0 && (
                <div style={{ fontSize: 12.5, color: "#7E9A63", textAlign: "center", padding: "12px 0", fontWeight: 600 }}>
                  Toutes les tâches sont complètes !
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Programme de cérémonie */}
        {ceremony.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #EDE6DA", marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FBF1E3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💍</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#382F23" }}>Programme de la cérémonie</div>
                <div style={{ fontSize: 12, color: "#9C8E76" }}>{ceremony.reduce((s, e) => s + (e.duration_min || 0), 0)} min · {ceremony.length} moments</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {ceremony.map((ev, i) => (
                <div key={ev.id} style={{ display: "flex", gap: 14, position: "relative" }}>
                  {/* Timeline line */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0, paddingTop: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#C96E2C", border: "2px solid #F4ECDD", zIndex: 1, flexShrink: 0 }} />
                    {i < ceremony.length - 1 && (
                      <div style={{ flex: 1, width: 2, background: "#F0EAE0", marginTop: 2, minHeight: 20 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: i < ceremony.length - 1 ? 12 : 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#382F23" }}>{ev.title}</span>
                      {ev.duration_min > 0 && (
                        <span style={{ fontSize: 11, color: "#9C8E76", background: "#F5EEE4", padding: "1px 7px", borderRadius: 99 }}>{ev.duration_min} min</span>
                      )}
                    </div>
                    {ev.who && <div style={{ fontSize: 11.5, color: "#9C8E76", marginTop: 2 }}>{ev.who}</div>}
                    {ev.music && <div style={{ fontSize: 11.5, color: "#B07A2C", marginTop: 1 }}>🎵 {ev.music}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 40, paddingTop: 24, borderTop: "1px solid #E8DFD0" }}>
          <div style={{ display: "inline-block", background: "#382F23", padding: "7px 16px", borderRadius: 9, color: "#F4ECDD", fontSize: 13, fontWeight: 800, letterSpacing: 3, textTransform: "lowercase", marginBottom: 10 }}>
            jour j
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#BBA98A" }}>Vue en lecture seule · Partagé par {w.partner_a} &amp; {w.partner_b}</p>
        </div>

      </div>
    </div>
  );
}
