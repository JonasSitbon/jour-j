import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geist = Inter({ subsets: ["latin"], variable: "--font-geist", weight: ["300", "400", "500", "600", "700"] });
const geistMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-geist-mono", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://the-cockpit.fr"),
  title: {
    default: "Jour J — Organisez votre mariage sereinement",
    template: "%s | Jour J",
  },
  description: "Gérez tous les aspects de votre mariage : invités, prestataires, budget, planning et Jour J. Gratuit, élégant et collaboratif.",
  keywords: ["organisation mariage", "wedding planner", "liste invités mariage", "budget mariage", "planning mariage", "tableau de bord mariage"],
  authors: [{ name: "Jour J" }],
  creator: "Jour J",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://the-cockpit.fr",
    siteName: "Jour J",
    title: "Jour J — Organisez votre mariage sereinement",
    description: "Gérez tous les aspects de votre mariage : invités, prestataires, budget, planning et Jour J. Gratuit, élégant et collaboratif.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Jour J — Tableau de bord mariage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jour J — Organisez votre mariage sereinement",
    description: "Gérez tous les aspects de votre mariage. Gratuit et élégant.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Jour J" },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="light" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
