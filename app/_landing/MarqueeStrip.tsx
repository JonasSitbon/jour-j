"use client";

import { motion } from "framer-motion";
import { TC, GOLD } from "./tokens";

export default function MarqueeStrip() {
  const items = [
    "16 modules tout-en-un", "Aide au choix de date", "Plan de table visuel",
    "Collaboration en temps réel", "Export PDF", "Partage avec vos proches",
    "Pour les mariés et les planners", "100% gratuit", "Données sécurisées", "Accessible sur mobile",
  ];
  const doubled = [...items, ...items];
  return (
    <div className="py-5 overflow-hidden border-y" style={{ background: "#F9EDE3", borderColor: `${TC}20` }}>
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
        className="flex whitespace-nowrap gap-8"
      >
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-[13px] font-medium shrink-0" style={{ color: TC }}>
            <span className="text-[10px]" style={{ color: GOLD }}>✦</span>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
