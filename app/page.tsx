"use client";

import { useLenis } from "./_landing/shared";
import Nav             from "./_landing/NavSection";
import Hero            from "./_landing/HeroSection";
import Stats           from "./_landing/StatsSection";
import ModuleCards     from "./_landing/ModuleCards";
import InteractiveDemo from "./_landing/DemoSection";
import PricingCTA      from "./_landing/PricingSection";
import FAQ             from "./_landing/FAQSection";
import Footer          from "./_landing/FooterSection";

export default function LandingPage() {
  useLenis();

  return (
    <>
      <Nav />
      <Hero />
      <Stats />
      <ModuleCards />
      <InteractiveDemo />
      <PricingCTA />
      <FAQ />
      <Footer />
    </>
  );
}
