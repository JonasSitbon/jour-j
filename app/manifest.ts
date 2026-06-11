import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jour J — Organisez votre mariage",
    short_name: "Jour J",
    description: "L'application tout-en-un pour organiser votre mariage parfait",
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
      { name: "Invités", short_name: "Invités", description: "Gérer la liste d'invités", url: "/guests", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Checklist", short_name: "Checklist", description: "Voir les tâches à faire", url: "/checklist", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Budget", short_name: "Budget", description: "Suivre les dépenses", url: "/budget", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
