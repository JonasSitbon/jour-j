import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Jour J",
  description: "Conditions générales d'utilisation de la plateforme Jour J by The Cockpit.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "14 juin 2026";
const CONTACT_EMAIL = "contact@the-cockpit.fr";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
      <div className="space-y-3 text-white/60 text-[14px] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-white/80">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Nav minimal */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-widest uppercase text-white/60 hover:text-white transition-colors">
            ← Jour J
          </Link>
          <span className="text-xs text-white/30">Mise à jour : {LAST_UPDATED}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-14">
        {/* Titre */}
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-rose-400">Légal</p>
          <h1 className="text-4xl font-bold tracking-tight">Conditions d&apos;utilisation</h1>
          <p className="text-white/50 text-sm">
            Applicables à la plateforme <strong className="text-white/70">Jour J</strong> éditée par{" "}
            <strong className="text-white/70">The Cockpit</strong>.
          </p>
        </div>

        <Section id="objet" title="1. Objet">
          <p>
            Les présentes conditions générales d&apos;utilisation (CGU) régissent l&apos;accès et l&apos;utilisation de la
            plateforme <strong>Jour J</strong>, accessible à l&apos;adresse <strong>jour-j.app</strong>, éditée par
            The Cockpit. En créant un compte ou en utilisant le service, vous acceptez sans réserve les présentes CGU.
          </p>
        </Section>

        <Section id="service" title="2. Description du service">
          <p>
            Jour J est une application web de planification de mariage proposant notamment :
          </p>
          <ul>
            <li>Gestion des invités et RSVP</li>
            <li>Suivi du budget et des paiements</li>
            <li>Gestion des prestataires</li>
            <li>Checklist et planning</li>
            <li>Plan de table visuel</li>
            <li>Déroulé du Jour J</li>
            <li>Journal de bord et moodboard</li>
            <li>Collaboration multi-utilisateurs avec rôles</li>
          </ul>
        </Section>

        <Section id="acces" title="3. Accès et compte utilisateur">
          <p>
            L&apos;accès au service nécessite la création d&apos;un compte avec une adresse e-mail valide. Vous êtes
            responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte.
          </p>
          <p>
            L&apos;essai gratuit de 7 jours donne accès à l&apos;ensemble des fonctionnalités sans engagement ni carte bancaire.
            À l&apos;issue de la période d&apos;essai, l&apos;accès aux fonctionnalités est conditionné à la souscription d&apos;un abonnement.
          </p>
        </Section>

        <Section id="abonnements" title="4. Abonnements et tarifs">
          <p>Deux formules sont disponibles :</p>
          <ul>
            <li><strong>Couple</strong> — 3 €/mois ou 30 €/an. Pour 1 mariage, usage personnel.</li>
            <li><strong>Wedding Planner (Pro)</strong> — 12 €/mois ou 120 €/an. Jusqu&apos;à 5 mariages actifs simultanément.</li>
          </ul>
          <p>
            Les tarifs sont indiqués TTC. The Cockpit se réserve le droit de modifier ses tarifs avec un préavis de 30 jours.
            Les abonnements en cours ne sont pas affectés jusqu&apos;à leur renouvellement.
          </p>
        </Section>

        <Section id="donnees" title="5. Données et contenu utilisateur">
          <p>
            Vous conservez la propriété entière de vos données (liste d&apos;invités, budget, informations de mariage, etc.).
            The Cockpit n&apos;utilise pas vos données personnelles à des fins commerciales ou publicitaires.
          </p>
          <p>
            Vous pouvez exporter et supprimer vos données à tout moment depuis les paramètres de votre compte. En cas de
            suppression de compte, toutes vos données sont effacées définitivement de nos serveurs dans un délai de 30 jours.
          </p>
        </Section>

        <Section id="responsabilites" title="6. Responsabilités">
          <p>
            The Cockpit s&apos;engage à maintenir le service disponible 24h/24 et 7j/7, dans la limite du raisonnable.
            Des interruptions ponctuelles pour maintenance peuvent survenir et seront annoncées dans la mesure du possible.
          </p>
          <p>
            The Cockpit ne saurait être tenu responsable de toute perte de données résultant d&apos;une interruption du service
            ou d&apos;une suppression volontaire par l&apos;utilisateur.
          </p>
        </Section>

        <Section id="resiliation" title="7. Résiliation">
          <p>
            Vous pouvez résilier votre abonnement à tout moment depuis vos paramètres de compte. La résiliation prend effet
            à la fin de la période d&apos;abonnement en cours. Aucun remboursement prorata n&apos;est effectué.
          </p>
          <p>
            The Cockpit se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU.
          </p>
        </Section>

        <Section id="loi" title="8. Droit applicable">
          <p>
            Les présentes CGU sont régies par le droit français. En cas de litige, une solution amiable sera recherchée en
            priorité. À défaut, les tribunaux français seront seuls compétents.
          </p>
          <p>
            Pour toute question : <a href={`mailto:${CONTACT_EMAIL}`} className="text-rose-400 hover:underline">{CONTACT_EMAIL}</a>
          </p>
        </Section>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row gap-4 text-sm">
          <Link href="/privacy" className="text-rose-400 hover:underline">Politique de confidentialité →</Link>
          <Link href="/" className="text-white/40 hover:text-white/60 transition-colors">← Retour à l&apos;accueil</Link>
        </div>
      </main>
    </div>
  );
}
