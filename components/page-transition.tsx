"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// ─── Loading progress bar ────────────────────────────────────────────────────

function ProgressBar({ active }: { active: boolean }) {
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    setVisible(true);
    setWidth(0);

    // Animate to ~90% quickly, then to 100% on cleanup
    const t1 = setTimeout(() => setWidth(72), 20);
    const t2 = setTimeout(() => setWidth(90), 200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  useEffect(() => {
    if (!active && visible) {
      // Complete the bar then fade out
      setWidth(100);
      const t = setTimeout(() => setVisible(false), 420);
      return () => clearTimeout(t);
    }
  }, [active, visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      style={{ height: 2 }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          background: "#C96E2C",
          transition: width === 100
            ? "width 0.18s ease-out, opacity 0.22s ease 0.18s"
            : "width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          opacity: width === 100 ? 0 : 1,
          borderRadius: "0 2px 2px 0",
          boxShadow: "0 0 8px rgba(201, 110, 44, 0.5)",
        }}
      />
    </div>
  );
}

// ─── Page transition wrapper ─────────────────────────────────────────────────

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (pathname !== prevPath) {
      setTransitioning(true);
      const t = setTimeout(() => {
        setPrevPath(pathname);
        setTransitioning(false);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [pathname, prevPath]);

  return (
    <>
      <ProgressBar active={transitioning} />
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
