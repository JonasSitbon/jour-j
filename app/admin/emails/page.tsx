"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Icon } from "@/components/icon";

/* ── Raw HTML templates (inline) ─────────────────────────────────── */
const TEMPLATES = [
  {
    id: "confirmation",
    label: "Confirmation d'inscription",
    description: "Envoyé lors de la création d'un compte. Contient le lien de vérification email.",
    variables: ["{{ .ConfirmationURL }}", "{{ .SiteURL }}"],
    color: "#C96E2C",
    icon: "check-circle",
    supabaseKey: "confirm_signup",
  },
  {
    id: "invite",
    label: "Invitation collaborateur",
    description: "Envoyé quand un couple invite quelqu'un à collaborer sur l'organisation.",
    variables: ["{{ .ConfirmationURL }}", "{{ .SiteURL }}"],
    color: "#7E9A63",
    icon: "mail",
    supabaseKey: "invite",
  },
  {
    id: "reset-password",
    label: "Réinitialisation mot de passe",
    description: "Envoyé lors d'une demande de réinitialisation de mot de passe.",
    variables: ["{{ .ConfirmationURL }}", "{{ .Email }}", "{{ .SiteURL }}"],
    color: "#382F23",
    icon: "key",
    supabaseKey: "recovery",
  },
];

const SUPABASE_DASHBOARD = "https://supabase.com/dashboard/project/sxoocdnedizxlegwshxl/auth/templates";

/* ── Lazy-loaded template HTML ──────────────────────────────────── */
async function fetchTemplate(id: string): Promise<string> {
  // We embed file content as static strings since we can't import .html at runtime
  // The real HTML is fetched from the public path or imported statically
  const res = await fetch(`/api/admin/email-template?id=${id}`).catch(() => null);
  if (res?.ok) return res.text();
  return `<!-- Template "${id}" non disponible en preview -->`;
}

export default function AdminEmailsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function openTemplate(id: string) {
    setSelected(id);
    setPreviewLoading(true);
    const html = await fetchTemplate(id);
    setPreviewHtml(html);
    setPreviewLoading(false);
  }

  async function copyTemplate(id: string) {
    const html = await fetchTemplate(id);
    await navigator.clipboard.writeText(html).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function sendTest() {
    if (!testEmail.trim()) return;
    setTestLoading(true);
    setTestResult(null);
    const c = createClient();
    const { error } = await c.auth.resetPasswordForEmail(testEmail.trim(), {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setTestLoading(false);
    setTestResult(error
      ? { ok: false, msg: error.message }
      : { ok: true, msg: "Email de test envoyé avec succès !" }
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#f0ead8" }}>Templates Email</h1>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          Visualisez et copiez les templates HTML pour les configurer dans Supabase.
        </p>
      </div>

      {/* Step guide */}
      <div className="rounded-xl p-5 border mb-6" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
        <div className="flex items-center gap-2 mb-4">
          <span style={{ color: "#60a5fa" }}><Icon name="info" size={16} /></span>
          <h2 className="text-sm font-semibold" style={{ color: "#9ca3af" }}>Comment configurer les emails Supabase</h2>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { step: "1", text: 'Cliquez sur "Copier HTML" sur un template ci-dessous' },
            { step: "2", text: 'Ouvrez le dashboard Supabase → Auth → Email Templates' },
            { step: "3", text: 'Sélectionnez le template correspondant (Confirm signup, Invite, Recovery…)' },
            { step: "4", text: 'Collez le HTML dans la zone "Body" et sauvegardez' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ background: "#C96E2C22", color: "#e2945a" }}
              >
                {item.step}
              </div>
              <p className="text-sm" style={{ color: "#9ca3af" }}>{item.text}</p>
            </div>
          ))}
        </div>
        <a
          href={SUPABASE_DASHBOARD}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "#C96E2C", color: "#fffaf2" }}
        >
          <Icon name="link" size={14} />
          Ouvrir le dashboard Supabase
        </a>
      </div>

      {/* Templates list */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className="rounded-xl border overflow-hidden"
            style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}
          >
            {/* Template header */}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${tpl.color}22` }}
                >
                  <span style={{ color: tpl.color }}><Icon name={tpl.icon} size={17} /></span>
                </div>
                <div>
                  <div className="font-semibold text-[14px]" style={{ color: "#f0ead8" }}>{tpl.label}</div>
                  <div className="text-[12px]" style={{ color: "#6b7280" }}>{tpl.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => selected === tpl.id ? setSelected(null) : openTemplate(tpl.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                  style={{ background: "#0f1117", borderColor: "#2a2a3e", color: "#9ca3af" }}
                >
                  <Icon name="eye" size={13} />
                  {selected === tpl.id ? "Fermer" : "Preview"}
                </button>
                <button
                  onClick={() => copyTemplate(tpl.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: copied === tpl.id ? "#16562233" : "#C96E2C22",
                    color: copied === tpl.id ? "#4ade80" : "#e2945a",
                  }}
                >
                  <Icon name={copied === tpl.id ? "check" : "copy"} size={13} />
                  {copied === tpl.id ? "Copié !" : "Copier HTML"}
                </button>
              </div>
            </div>

            {/* Variables */}
            <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
              <span className="text-[11px]" style={{ color: "#4b5563" }}>Variables :</span>
              {tpl.variables.map((v) => (
                <span
                  key={v}
                  className="font-mono text-[10px] px-2 py-0.5 rounded"
                  style={{ background: "#0f1117", color: "#60a5fa" }}
                >
                  {v}
                </span>
              ))}
              <span
                className="ml-auto text-[11px] px-2 py-0.5 rounded"
                style={{ background: "#0f1117", color: "#4b5563" }}
              >
                Clé Supabase : <span style={{ color: "#9ca3af" }}>{tpl.supabaseKey}</span>
              </span>
            </div>

            {/* Preview panel */}
            {selected === tpl.id && (
              <div className="border-t" style={{ borderColor: "#2a2a3e" }}>
                <div className="px-5 py-2 flex items-center gap-2 border-b" style={{ borderColor: "#1e1e30" }}>
                  <span style={{ color: "#4b5563" }}><Icon name="eye" size={13} /></span>
                  <span className="text-xs" style={{ color: "#4b5563" }}>Aperçu rendu</span>
                </div>
                {previewLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <iframe
                    srcDoc={previewHtml || `<p style="font-family:sans-serif;color:#666;padding:20px;">Aperçu non disponible — copiez le HTML et ouvrez-le dans un navigateur.</p>`}
                    className="w-full border-0"
                    style={{ height: "520px", background: "#fff" }}
                    sandbox="allow-same-origin"
                    title={`Preview ${tpl.label}`}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Test email form */}
      <div className="rounded-xl p-5 border" style={{ background: "#1a1a2e", borderColor: "#2a2a3e" }}>
        <div className="flex items-center gap-2 mb-1">
          <span style={{ color: "#9ca3af" }}><Icon name="mail" size={16} /></span>
          <h2 className="text-sm font-semibold" style={{ color: "#9ca3af" }}>Tester l'envoi d'email</h2>
        </div>
        <p className="text-xs mb-4" style={{ color: "#4b5563" }}>
          Envoie un email de réinitialisation de mot de passe (pour tester la livraison et le rendu).
        </p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs mb-1.5" style={{ color: "#6b7280" }}>Adresse email de test</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors"
              style={{ background: "#0f1117", borderColor: "#2a2a3e", color: "#d1cec8" }}
            />
          </div>
          <button
            onClick={sendTest}
            disabled={testLoading || !testEmail.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            style={{ background: "#C96E2C", color: "#fffaf2" }}
          >
            {testLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Icon name="mail" size={15} />
            )}
            Envoyer test
          </button>
        </div>
        {testResult && (
          <div
            className="mt-3 px-4 py-2.5 rounded-lg text-sm"
            style={{
              background: testResult.ok ? "#16562222" : "#c0533a22",
              color: testResult.ok ? "#4ade80" : "#f87171",
            }}
          >
            {testResult.msg}
          </div>
        )}
      </div>
    </div>
  );
}
