"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TC, TEXT_DARK, TEXT_MID } from "./tokens";
import { FadeIn, Pill } from "./shared";
import { Ic } from "./visuals";

const FEATURES = [
  { id: "dashboard",  icon: "grid",    title: "Tableau de bord",      desc: "Vue d'ensemble de votre mariage avec countdown J-X, stats en temps réel et raccourcis intelligents.", color: TC },
  { id: "guests",     icon: "users",   title: "Invités & RSVP",       desc: "Gérez vos 150+ invités, suivez les réponses, les régimes alimentaires et l'hébergement.", color: "#3B6EA5" },
  { id: "budget",     icon: "wallet",  title: "Budget & Paiements",   desc: "Suivez chaque dépense, planifiez les échéances et comparez avec les moyennes nationales.", color: "#C9A83C" },
  { id: "timeline",   icon: "list",    title: "Timeline",             desc: "Rétroplanning complet sur 12-18 mois avec navigation par mois et indicateurs de retard.", color: "#5A9E6F" },
  { id: "dayj",       icon: "clock",   title: "Déroulé Jour J",       desc: "Planifiez chaque minute de votre journée avec 3 templates, mode EN DIRECT et alertes.", color: "#B5586E" },
  { id: "checklist",  icon: "check",   title: "Checklist",            desc: "250+ tâches pré-remplies organisées par catégorie, avec filtres et export PDF.", color: "#1F7A5C" },
  { id: "seating",    icon: "grid",    title: "Plan de table",        desc: "Éditeur visuel drag & drop des tables avec gestion des conflits et contraintes régime.", color: "#8B6E3E" },
  { id: "vendors",    icon: "file",    title: "Prestataires",         desc: "CRM complet pour vos fournisseurs : devis, contrats, relances automatiques.", color: "#6B4A8C" },
  { id: "ceremony",   icon: "rings",   title: "Programme cérémonie",  desc: "Construisez votre programme civil, laïc ou religieux avec musiques et intervenants.", color: TC },
  { id: "music",      icon: "music",   title: "Musique & Playlist",   desc: "10 moments clés, approbation par les mariés, export PDF pour le DJ/orchestre.", color: "#3B6EA5" },
  { id: "dates",      icon: "calendar",title: "Sélecteur de dates",   desc: "Comparez vos dates candidates avec la météo prévisionnelle, un score automatique et un export tableau.", color: "#1F7A5C" },
  { id: "contacts",   icon: "key",     title: "Personnes clés",       desc: "Contacts d'urgence, témoins, cortège — toujours accessibles depuis l'app.", color: "#B5586E" },
  { id: "gifts",      icon: "gift",    title: "Cadeaux",              desc: "Liste de mariage digitale avec suivi des remerciements envoyés.", color: "#C9A83C" },
  { id: "journal",    icon: "edit",    title: "Journal de bord",      desc: "Capturez vos inspirations, décisions et souvenirs tout au long de la préparation.", color: "#5A9E6F" },
  { id: "moodboard",  icon: "sparkle", title: "Mood Board",           desc: "Espace visuel pour votre style, couleurs et inspirations partagées avec vos prestataires.", color: "#8B6E3E" },
  { id: "sharing",    icon: "users",   title: "Collaboration",        desc: "Invitez votre famille, wedding planner et prestataires avec des rôles personnalisés.", color: "#6B4A8C" },
];

function BentoCard({ f, index }: { f: typeof FEATURES[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.55, delay: (index % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl border overflow-hidden cursor-default group transition-all duration-300"
      style={{
        background: "#FFFFFF",
        borderColor: "rgba(201,110,44,0.1)",
        boxShadow: "0 2px 12px rgba(56,47,35,0.06)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px rgba(56,47,35,0.12), 0 0 0 1px ${f.color}30`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(56,47,35,0.06)";
      }}
    >
      <div className="p-5 flex flex-col gap-3 h-full">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${f.color}18`, color: f.color }}>
          <Ic name={f.icon} size={20} />
        </div>
        <div>
          <div className="text-[14px] font-semibold mb-1" style={{ color: TEXT_DARK }}>{f.title}</div>
          <div className="text-[12.5px] leading-relaxed" style={{ color: TEXT_MID }}>{f.desc}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function FeaturesSection() {
  return (
    <section className="py-24 px-6" style={{ background: "#FDFAF5" }}>
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-14">
          <Pill>16 modules</Pill>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold mt-4 tracking-tight" style={{ color: TEXT_DARK }}>
            Tout pour votre mariage,<br />
            <span style={{ color: TC }}>en un seul endroit.</span>
          </h2>
        </FadeIn>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <BentoCard key={f.id} f={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
