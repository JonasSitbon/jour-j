import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geist = Inter({ subsets: ["latin"], variable: "--font-geist", weight: ["300", "400", "500", "600", "700"] });
const geistMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-geist-mono", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Jour J — Organisez votre mariage",
  description: "L'application tout-en-un pour préparer votre mariage : invités, budget, prestataires, checklist et plan de table.",
  themeColor: "#C96E2C",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Jour J" },
  openGraph: {
    title: "Jour J — Organisez votre mariage",
    description: "L'application tout-en-un pour préparer votre mariage sereinement.",
    locale: "fr_FR",
    type: "website",
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
