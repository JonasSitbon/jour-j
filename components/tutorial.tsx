"use client";

import { useState, useEffect } from "react";
import { Icon } from "./icon";

interface Step { icon: string; title: string; desc: string; }

export function PageTutorial({ pageId, title, steps }: { pageId: string; title: string; steps: Step[] }) {
  const key = `jj_tuto_${pageId}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(key)) setVisible(true);
  }, [key]);

  if (!visible) return (
    <button onClick={() => setVisible(true)}
      className="mb-5 flex items-center gap-1.5 text-[12.5px] text-text-3 hover:text-primary transition px-3 py-1.5 rounded-full border border-line hover:border-primary/40 bg-surface hover:bg-primary-softer">
      <Icon name="info" size={13} />Afficher l&apos;aide
    </button>
  );

  const dismiss = () => { localStorage.setItem(key, "1"); setVisible(false); };

  return (
    <div className="mb-5 rounded-card border border-primary/25 bg-primary-softer p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Icon name="sparkle" size={16} className="text-primary" />
          <span className="font-semibold text-[14.5px] text-primary-700">{title}</span>
        </div>
        <button onClick={dismiss} className="icon-btn w-7 h-7 text-text-3 hover:text-text shrink-0" title="Fermer">
          <Icon name="x" size={15} />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-[10px] shrink-0 flex items-center justify-center bg-primary-soft text-primary-700">
              <Icon name={s.icon} size={16} />
            </span>
            <div>
              <div className="text-[13px] font-semibold">{s.title}</div>
              <div className="text-[12px] text-text-2 mt-0.5 leading-relaxed">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={dismiss} className="text-[12.5px] text-primary-700 font-medium hover:underline">
        Compris, ne plus afficher →
      </button>
    </div>
  );
}
