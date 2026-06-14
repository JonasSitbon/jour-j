import Link from "next/link";
import { Logo, Icon } from "@/components/icon";

interface Props {
  searchParams: { type?: string; error?: string };
}

const CONFIGS = {
  signup: {
    icon: "check-circle",
    iconColor: "var(--sage)",
    iconBg: "var(--sage-soft)",
    title: "Email confirmé !",
    desc: "Votre compte est activé. Bienvenue sur Jour J — organisons votre mariage ensemble.",
    cta: "Commencer →",
    href: "/onboarding",
  },
  magiclink: {
    icon: "key",
    iconColor: "var(--primary)",
    iconBg: "color-mix(in srgb, var(--primary) 12%, transparent)",
    title: "Connexion réussie !",
    desc: "Votre lien magique a fonctionné. Vous êtes connecté à votre espace mariage.",
    cta: "Accéder à mon tableau de bord →",
    href: "/dashboard",
  },
  invite: {
    icon: "rings",
    iconColor: "var(--gold)",
    iconBg: "color-mix(in srgb, var(--gold) 12%, transparent)",
    title: "Invitation acceptée !",
    desc: "Vous avez rejoint l'espace mariage. Tout est prêt pour collaborer ensemble.",
    cta: "Voir l'espace mariage →",
    href: "/dashboard",
  },
} as const;

export default function AuthConfirmedPage({ searchParams }: Props) {
  const { type, error } = searchParams;
  const conf = type && type in CONFIGS ? CONFIGS[type as keyof typeof CONFIGS] : null;

  return (
    <div className="relative z-[1] min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-[420px]">

        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-9 h-9 text-primary"><Logo size={34} /></div>
          <div className="text-[17px] font-semibold">Jour <b>J</b></div>
        </div>

        {error || !conf ? (
          /* Erreur */
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "var(--coral-soft)" }}>
              <Icon name="alert" size={26} style={{ color: "var(--coral)" }} />
            </div>
            <div>
              <h1 className="text-[22px] font-semibold mb-2">Lien invalide ou expiré</h1>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                Ce lien n&apos;est plus valide. Il a peut-être déjà été utilisé ou a expiré.
              </p>
            </div>
            <Link href="/login"
              className="w-full py-3.5 rounded-xl text-center text-[15px] font-semibold transition-opacity hover:opacity-85"
              style={{ background: "var(--primary)", color: "#fff" }}>
              Retour à la connexion
            </Link>
            <Link href="/reset-password"
              className="text-[13.5px] transition-colors hover:opacity-70"
              style={{ color: "var(--text-2)" }}>
              Renvoyer un lien de réinitialisation
            </Link>
          </div>
        ) : (
          /* Succès */
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: conf.iconBg, color: conf.iconColor }}>
              <Icon name={conf.icon} size={30} />
            </div>
            <div>
              <h1 className="text-[26px] font-semibold tracking-[-.025em] mb-2">{conf.title}</h1>
              <p className="text-[14.5px] leading-relaxed" style={{ color: "var(--text-2)" }}>{conf.desc}</p>
            </div>
            <Link href={conf.href}
              className="w-full py-3.5 rounded-xl text-center text-[15px] font-semibold transition-opacity hover:opacity-85"
              style={{ background: "var(--primary)", color: "#fff" }}>
              {conf.cta}
            </Link>
            <Link href="/"
              className="text-[13px] transition-colors hover:opacity-70"
              style={{ color: "var(--text-3)" }}>
              Retour à l&apos;accueil
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
