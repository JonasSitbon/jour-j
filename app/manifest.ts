import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Cockpit — Organisez votre mariage",
    short_name: "The Cockpit",
    description: "L'application tout-en-un pour organiser votre mariage parfait. Budget, invités, prestataires, planning, musique et Jour J.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F4ECDD",
    theme_color: "#C96E2C",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    categories: ["lifestyle", "productivity"],
    lang: "fr",
    dir: "ltr",
    scope: "/",
    shortcuts: [
      { name: "Tableau de bord",    short_name: "Accueil",    description: "Vue d'ensemble du mariage",      url: "/dashboard",  icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Invités & RSVP",     short_name: "Invités",    description: "Gérer la liste d'invités",       url: "/guests",     icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Checklist",          short_name: "Checklist",  description: "Tâches à accomplir",             url: "/checklist",  icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Budget & paiements", short_name: "Budget",     description: "Suivre les dépenses",            url: "/budget",     icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Déroulé Jour J",     short_name: "Jour J",     description: "Planning de la journée",         url: "/dayj",       icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Musique",            short_name: "Musique",    description: "Playlist et chansons",           url: "/music",      icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
