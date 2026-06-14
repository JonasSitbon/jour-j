import { NextRequest, NextResponse } from "next/server";

const BASE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Jour J</title>
</head>
<body style="margin:0;padding:0;background:#F4ECDD;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<!-- tracking pixel: remplacer {{TYPE}} par le nom du template (confirmation, invite…) -->
<img src="https://the-cockpit.fr/api/track/open?t={{TYPE}}" width="1" height="1" style="display:none;border:0;" alt="" />
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4ECDD;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:#1C1208;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;background:#C96E2C;border-radius:8px;display:inline-block;line-height:36px;text-align:center;font-size:18px;font-weight:900;color:#FFFAF2;">J</div>
            <span style="font-size:20px;font-weight:700;color:#FFFAF2;letter-spacing:-0.02em;">Jour J</span>
          </div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="background:#FFFFFF;padding:40px 40px 32px;border-left:1px solid #E8E2D8;border-right:1px solid #E8E2D8;">
          {{BODY}}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#FDFAF5;border:1px solid #E8E2D8;border-top:none;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:#A08B78;">Cet email a été envoyé par <strong>Jour J</strong> by The Cockpit — Planification de mariage</p>
          <p style="margin:0;font-size:11px;color:#C5B8A8;">Si vous n'avez pas demandé cet email, ignorez-le simplement.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

const TEMPLATES: Record<string, string> = {

  confirmation: BASE.replace("{{BODY}}", `
    <!-- Accent bar -->
    <div style="width:48px;height:4px;background:#C96E2C;border-radius:2px;margin-bottom:28px;"></div>

    <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#1C1208;letter-spacing:-0.02em;line-height:1.2;">
      Bienvenue sur<br/>Jour J 💍
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6B5744;line-height:1.7;">
      Votre compte est presque prêt. Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et accéder à votre espace de planification.
    </p>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#C96E2C;border-radius:10px;">
          <a href="{{ .ConfirmationURL }}"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;letter-spacing:0.01em;">
            Confirmer mon adresse email →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#A08B78;">
      Ce lien expire dans <strong>24 heures</strong>. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
    </p>
    <p style="margin:0;font-size:11px;color:#C5B8A8;word-break:break-all;">{{ .ConfirmationURL }}</p>

    <!-- Divider -->
    <div style="border-top:1px solid #F0E8DC;margin:28px 0;"></div>

    <!-- Divider -->
    <div style="border-top:1px solid #F0E8DC;margin:28px 0;"></div>

    <p style="margin:0 0 12px;font-size:13px;color:#A08B78;">
      ✦ &nbsp;Organisez votre mariage avec soin — invités, budget, planning, plan de table et Jour J.
    </p>
    <a href="https://the-cockpit.fr/api/track/click?url=https%3A%2F%2Fthe-cockpit.fr%2Fdashboard&t=confirmation_dashboard"
       style="font-size:12px;color:#C96E2C;text-decoration:underline;">Accéder directement à mon espace →</a>
  `),

  invite: BASE.replace("{{BODY}}", `
    <!-- Accent bar -->
    <div style="width:48px;height:4px;background:#7E9A63;border-radius:2px;margin-bottom:28px;"></div>

    <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#1C1208;letter-spacing:-0.02em;line-height:1.2;">
      Vous êtes invité(e) à collaborer 🥂
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6B5744;line-height:1.7;">
      Quelqu'un vous a invité(e) à rejoindre un espace mariage sur <strong>Jour J</strong>. Cliquez ci-dessous pour accepter l'invitation et accéder à l'organisation.
    </p>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#7E9A63;border-radius:10px;">
          <a href="{{ .ConfirmationURL }}"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;letter-spacing:0.01em;">
            Accepter l'invitation →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#A08B78;">
      Ce lien expire dans <strong>24 heures</strong>. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
    </p>
    <p style="margin:0;font-size:11px;color:#C5B8A8;word-break:break-all;">{{ .ConfirmationURL }}</p>

    <!-- Divider -->
    <div style="border-top:1px solid #F0E8DC;margin:28px 0;"></div>

    <p style="margin:0 0 12px;font-size:13px;color:#A08B78;">
      ✦ &nbsp;Jour J — L'outil tout-en-un pour organiser un mariage parfait.
    </p>
    <a href="https://the-cockpit.fr/api/track/click?url=https%3A%2F%2Fthe-cockpit.fr%2Fdashboard&t=invite_dashboard"
       style="font-size:12px;color:#7E9A63;text-decoration:underline;">Accéder directement à mon espace →</a>
  `),

  "magic-link": BASE.replace("{{BODY}}", `
    <!-- Accent bar -->
    <div style="width:48px;height:4px;background:#6B4A8C;border-radius:2px;margin-bottom:28px;"></div>

    <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#1C1208;letter-spacing:-0.02em;line-height:1.2;">
      Votre lien de connexion ✨
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6B5744;line-height:1.7;">
      Vous avez demandé à vous connecter à <strong>Jour J</strong> sans mot de passe. Cliquez sur le bouton ci-dessous pour accéder directement à votre espace mariage.
    </p>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#6B4A8C;border-radius:10px;">
          <a href="{{ .ConfirmationURL }}"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;letter-spacing:0.01em;">
            Me connecter en un clic →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#A08B78;">
      Ce lien expire dans <strong>1 heure</strong> et ne peut être utilisé qu'une seule fois. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
    </p>
    <p style="margin:0 0 20px;font-size:11px;color:#C5B8A8;word-break:break-all;">{{ .ConfirmationURL }}</p>

    <!-- Security note -->
    <div style="background:#F3EDF8;border:1px solid #D9C8EC;border-radius:8px;padding:14px 16px;">
      <p style="margin:0;font-size:12px;color:#5C3A7A;line-height:1.6;">
        🔒 &nbsp;Si vous n'avez pas demandé ce lien, ignorez cet email. Personne ne peut accéder à votre compte sans cliquer sur ce bouton.
      </p>
    </div>

    <!-- Divider -->
    <div style="border-top:1px solid #F0E8DC;margin:28px 0;"></div>

    <p style="margin:0 0 12px;font-size:13px;color:#A08B78;">
      ✦ &nbsp;Jour J — Connectez-vous en toute simplicité.
    </p>
    <a href="https://the-cockpit.fr/api/track/click?url=https%3A%2F%2Fthe-cockpit.fr%2Fdashboard&t=magic_link_dashboard"
       style="font-size:12px;color:#6B4A8C;text-decoration:underline;">Accéder directement à mon espace →</a>
  `),

  "reset-password": BASE.replace("{{BODY}}", `
    <!-- Accent bar -->
    <div style="width:48px;height:4px;background:#382F23;border-radius:2px;margin-bottom:28px;"></div>

    <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#1C1208;letter-spacing:-0.02em;line-height:1.2;">
      Réinitialisation de<br/>votre mot de passe 🔑
    </h1>
    <p style="margin:0 0 6px;font-size:15px;color:#6B5744;line-height:1.7;">
      Vous avez demandé à réinitialiser le mot de passe de votre compte <strong>Jour J</strong> associé à l'adresse :
    </p>
    <p style="margin:0 0 24px;font-size:14px;font-weight:600;color:#1C1208;">{{ .Email }}</p>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#1C1208;border-radius:10px;">
          <a href="{{ .ConfirmationURL }}"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;letter-spacing:0.01em;">
            Choisir un nouveau mot de passe →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#A08B78;">
      Ce lien expire dans <strong>1 heure</strong>. Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
    </p>
    <p style="margin:0 0 20px;font-size:11px;color:#C5B8A8;word-break:break-all;">{{ .ConfirmationURL }}</p>

    <!-- Security note -->
    <div style="background:#FBF0E8;border:1px solid #F0D8C0;border-radius:8px;padding:14px 16px;">
      <p style="margin:0;font-size:12px;color:#8B6030;line-height:1.6;">
        🔒 &nbsp;Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe actuel reste inchangé.
      </p>
    </div>
  `),
};

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const html = TEMPLATES[id];
  if (!html) return new NextResponse("Not found", { status: 404 });
  // Inject tracking type into pixel URL
  const rendered = html.replace("{{TYPE}}", encodeURIComponent(id));
  return new NextResponse(rendered, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
