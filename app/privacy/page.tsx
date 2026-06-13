// app/privacy/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Jour J",
  description:
    "Comment The Cockpit collecte, utilise et protège vos données personnelles dans l'application Jour J.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "13 juin 2026";
const CONTACT_EMAIL = "privacy@the-cockpit.fr";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Nav minimal */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold tracking-widest uppercase text-white/60 hover:text-white transition-colors"
          >
            ← Jour J
          </Link>
          <span className="text-xs text-white/30">Mise à jour : {LAST_UPDATED}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-14">
        {/* Titre */}
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-rose-400">Légal</p>
          <h1 className="text-4xl font-bold tracking-tight">
            Politique de confidentialité
          </h1>
          <p className="text-white/50 text-sm">
            Applicable à l'application <strong className="text-white/70">Jour J</strong> éditée par{" "}
            <strong className="text-white/70">The Cockpit</strong>.
          </p>
        </div>

        {/* 1. Responsable de traitement */}
        <Section id="responsable" title="1. Responsable du traitement">
          <p>
            Le responsable du traitement de vos données personnelles est :{" "}
            <strong>The Cockpit</strong>.
          </p>
          <p>
            Contact :{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-rose-400 hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>

        {/* 2. Données collectées */}
        <Section id="donnees" title="2. Données collectées">
          <p>Nous collectons uniquement les données nécessaires au fonctionnement de l'application :</p>

          <SubSection title="Lors de la création de compte">
            <ul>
              <li>Adresse e-mail</li>
              <li>Mot de passe (stocké sous forme chiffrée — nous n'y avons pas accès)</li>
            </ul>
          </SubSection>

          <SubSection title="Lors de l'utilisation de l'application">
            <ul>
              <li>Informations sur votre mariage (prénoms, date, lieu)</li>
              <li>Liste d'invités (noms, contacts, RSVP, régimes alimentaires)</li>
              <li>Budget, prestataires, planning, plan de table</li>
              <li>Contenu du journal de bord et du moodboard</li>
              <li>Données saisies dans tous les modules de l'application</li>
            </ul>
          </SubSection>

          <SubSection title="Données techniques (collectées automatiquement)">
            <ul>
              <li>Adresse IP (journaux de serveur, durée de conservation : 30 jours)</li>
              <li>
                Données d'erreurs techniques (via Sentry — voir section 5)
              </li>
            </ul>
          </SubSection>

          <p className="text-white/40 text-sm">
            Nous ne collectons pas de données de paiement directement — cette fonctionnalité, à venir,
            sera déléguée à un prestataire de paiement certifié PCI-DSS.
          </p>
        </Section>

        {/* 3. Finalités */}
        <Section id="finalites" title="3. Finalités du traitement">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 pr-4 text-white/50 font-medium">Finalité</th>
                <th className="text-left py-2 text-white/50 font-medium">Base légale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                ["Créer et gérer votre compte", "Exécution du contrat"],
                ["Fournir les fonctionnalités de l'application", "Exécution du contrat"],
                ["Envoyer les e-mails transactionnels (confirmation, RSVP)", "Exécution du contrat"],
                ["Assurer la sécurité et détecter les erreurs techniques", "Intérêt légitime"],
                ["Respecter nos obligations légales", "Obligation légale"],
              ].map(([fin, base]) => (
                <tr key={fin}>
                  <td className="py-3 pr-4 text-white/80">{fin}</td>
                  <td className="py-3 text-white/50">{base}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* 4. Sous-traitants */}
        <Section id="sous-traitants" title="4. Sous-traitants et transferts de données">
          <p>
            Nous faisons appel aux sous-traitants suivants pour opérer l'application :
          </p>

          <div className="space-y-4 mt-4">
            <Processor
              name="Supabase"
              role="Base de données, authentification, stockage"
              location="Union Européenne (région eu-west)"
              link="https://supabase.com/privacy"
            />
            <Processor
              name="Vercel"
              role="Hébergement et déploiement de l'application"
              location="Union Européenne (edge network mondial — des requêtes peuvent transiter hors UE)"
              link="https://vercel.com/legal/privacy-policy"
            />
            <Processor
              name="Sentry"
              role="Surveillance des erreurs techniques"
              location="États-Unis (couvert par les clauses contractuelles types UE)"
              link="https://sentry.io/privacy/"
            />
          </div>

          <p className="text-white/40 text-sm mt-4">
            Chacun de ces sous-traitants est lié par un accord de traitement des données (DPA)
            conforme au RGPD.
          </p>
        </Section>

        {/* 5. Cookies */}
        <Section id="cookies" title="5. Cookies et traceurs">
          <p>
            L'application utilise des cookies <strong>strictement nécessaires</strong> au
            fonctionnement du service :
          </p>
          <ul>
            <li>
              <strong>Cookie de session</strong> — maintient votre connexion via Supabase Auth.
              Durée : session + token de rafraîchissement (7 jours).
            </li>
          </ul>
          <p>
            Nous n'utilisons actuellement <strong>aucun cookie publicitaire ni traceur tiers</strong>.
            Si des outils d'analyse de trafic sont ajoutés à l'avenir, cette politique sera mise à
            jour et une bannière de consentement sera affichée.
          </p>
        </Section>

        {/* 6. Durée de conservation */}
        <Section id="conservation" title="6. Durée de conservation">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 pr-4 text-white/50 font-medium">Données</th>
                <th className="text-left py-2 text-white/50 font-medium">Durée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                ["Compte et données mariage", "Jusqu'à suppression du compte par l'utilisateur"],
                ["Journaux d'accès serveur", "30 jours"],
                ["Rapports d'erreurs Sentry", "90 jours"],
                ["Données archivées (planners)", "Conservées tant que le compte est actif"],
              ].map(([d, dur]) => (
                <tr key={d}>
                  <td className="py-3 pr-4 text-white/80">{d}</td>
                  <td className="py-3 text-white/50">{dur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* 7. Droits */}
        <Section id="droits" title="7. Vos droits">
          <p>
            Conformément au RGPD (articles 15 à 22), vous disposez des droits suivants sur vos
            données :
          </p>
          <ul>
            <li>
              <strong>Droit d'accès</strong> — obtenir une copie de vos données
            </li>
            <li>
              <strong>Droit de rectification</strong> — corriger des données inexactes
            </li>
            <li>
              <strong>Droit à l'effacement</strong> — supprimer votre compte et toutes vos données
            </li>
            <li>
              <strong>Droit à la portabilité</strong> — exporter vos données (format CSV ou JSON
              disponible depuis l'application)
            </li>
            <li>
              <strong>Droit d'opposition</strong> — vous opposer à certains traitements fondés sur
              l'intérêt légitime
            </li>
            <li>
              <strong>Droit à la limitation</strong> — demander la suspension temporaire du traitement
            </li>
          </ul>
          <p>
            Pour exercer ces droits, contactez-nous à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-rose-400 hover:underline">
              {CONTACT_EMAIL}
            </a>
            . Nous répondons dans un délai maximum de <strong>30 jours</strong>.
          </p>
          <p>
            Vous avez également le droit de déposer une réclamation auprès de la{" "}
            <a
              href="https://www.cnil.fr/fr/plaintes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-400 hover:underline"
            >
              CNIL
            </a>{" "}
            si vous estimez que vos droits ne sont pas respectés.
          </p>
        </Section>

        {/* 8. Sécurité */}
        <Section id="securite" title="8. Sécurité des données">
          <ul>
            <li>Connexions chiffrées en transit (HTTPS / TLS 1.3)</li>
            <li>Données au repos chiffrées par Supabase (AES-256)</li>
            <li>Politiques de sécurité au niveau base de données (Row-Level Security)</li>
            <li>Accès aux données restreint par rôles (owner / admin / editor / viewer)</li>
            <li>Pages publiques accessibles uniquement par token unique</li>
            <li>Surveillance des erreurs et alertes via Sentry</li>
          </ul>
        </Section>

        {/* 9. Modifications */}
        <Section id="modifications" title="9. Modifications de cette politique">
          <p>
            Cette politique peut être mise à jour pour refléter l'évolution du service ou des
            obligations légales. En cas de modification substantielle, nous vous informerons par
            e-mail ou par une notification dans l'application.
          </p>
          <p>
            La version en vigueur est toujours disponible sur{" "}
            <Link href="/privacy" className="text-rose-400 hover:underline">
              the-cockpit.fr/privacy
            </Link>
            .
          </p>
        </Section>

        {/* Contact */}
        <div className="border border-white/10 rounded-2xl p-6 space-y-2">
          <p className="text-sm font-semibold text-white/80">Une question sur vos données ?</p>
          <p className="text-sm text-white/50">
            Écrivez-nous à{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-rose-400 hover:underline">
              {CONTACT_EMAIL}
            </a>{" "}
            — nous répondons sous 30 jours.
          </p>
        </div>

        <p className="text-xs text-white/20 text-center pb-8">
          © {new Date().getFullYear()} The Cockpit — Jour J. Tous droits réservés.
        </p>
      </main>
    </div>
  );
}

/* ─── Helpers ─── */

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-4 scroll-mt-24">
      <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-3">{title}</h2>
      <div className="space-y-3 text-white/70 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-white/90">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-white/50 font-medium text-xs uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function Processor({
  name,
  role,
  location,
  link,
}: {
  name: string;
  role: string;
  location: string;
  link: string;
}) {
  return (
    <div className="border border-white/8 rounded-xl p-4 space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-white/90">{name}</span>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-rose-400 hover:underline"
        >
          Politique de confidentialité ↗
        </a>
      </div>
      <p className="text-white/60 text-sm">{role}</p>
      <p className="text-white/40 text-xs">📍 {location}</p>
    </div>
  );
}
