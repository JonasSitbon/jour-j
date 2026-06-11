"use client";

import React, { useEffect, useCallback, useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "./icon";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/* ------------------------------ Button ------------------------------ */
type Variant = "primary" | "secondary" | "ghost" | "danger";
export function Button({ variant = "secondary", size, icon, iconRight, block, className, children, disabled, ...rest }:
  { variant?: Variant; size?: "sm" | "lg"; icon?: string; iconRight?: string; block?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      className={cx("btn", `btn-${variant}`, size === "sm" && "btn-sm", size === "lg" && "btn-lg", block && "w-full", className)}
      whileHover={disabled ? undefined : { scale: 1.015, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.975, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      disabled={disabled}
      {...(rest as any)}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 16 : 18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 16 : 18} />}
    </motion.button>
  );
}

export function IconButton({ name, size = "md", title, badge, className, disabled, ...rest }:
  { name: string; size?: "sm" | "md"; title?: string; badge?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      title={title}
      className={cx("icon-btn", size === "sm" && "w-8 h-8", className)}
      whileHover={disabled ? undefined : { scale: 1.1 }}
      whileTap={disabled ? undefined : { scale: 0.88 }}
      transition={{ type: "spring", stiffness: 500, damping: 24 }}
      disabled={disabled}
      {...(rest as any)}
    >
      <Icon name={name} size={size === "sm" ? 18 : 20} />
      {badge && <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-coral border-2 border-surface" />}
    </motion.button>
  );
}

/* ------------------------------- Card -------------------------------- */
export function Card({ pad = true, hover, className, children, ...rest }:
  { pad?: boolean; hover?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  if (hover) {
    return (
      <motion.div
        className={cx("card", pad && "p-6", "cursor-pointer hover:shadow-md hover:border-line-strong", className)}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        {...(rest as any)}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <div className={cx("card", pad && "p-6", className)} {...rest}>
      {children}
    </div>
  );
}

/* ------------------------------ Badge -------------------------------- */
const TONES: Record<string, string> = {
  primary: "bg-primary-soft text-primary-700",
  sage: "bg-sage-soft text-sage",
  coral: "bg-coral-soft text-coral",
  amber: "bg-amber-soft text-[var(--gold-ink)]",
  gold: "bg-gold-soft text-[var(--gold-ink)]",
  neutral: "bg-surface-3 text-text-2",
};
export function Badge({ tone = "neutral", dot, icon, children }:
  { tone?: keyof typeof TONES; dot?: boolean; icon?: string; children: React.ReactNode }) {
  return (
    <span className={cx("badge", TONES[tone])}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

/* ------------------------------ Inputs ------------------------------- */
export function Field({ label, hint, children }: { label?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="field-label">{label}</span>}
      {children}
      {hint && <span className="text-xs text-text-3">{hint}</span>}
    </label>
  );
}

export function Input({ icon, className, ...rest }: { icon?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  if (!icon) return <input className={cx("input", className)} {...rest} />;
  return (
    <span className="relative flex items-center">
      <Icon name={icon} size={17} className="absolute left-3.5 text-text-3 pointer-events-none" />
      <input className={cx("input pl-10", className)} {...rest} />
    </span>
  );
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("input !h-auto py-3 leading-relaxed resize-y", className)} {...rest} />;
}

export function Search({ value, onChange, placeholder = "Rechercher…", className }:
  { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <span className={cx("relative flex items-center", className)}>
      <Icon name="search" size={17} className="absolute left-3.5 text-text-3 pointer-events-none" />
      <input className="input pl-10" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </span>
  );
}

export function Select({ value, onChange, options, className, ...rest }:
  { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange">) {
  return (
    <select className={cx("input cursor-pointer appearance-none bg-no-repeat pr-9 [background-position:right_12px_center]", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%239C8E76' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")" }}
      value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ---------------------------- Segmented ------------------------------ */
export function Segmented<T extends string>({ value, onChange, options }:
  { value: T; onChange: (v: T) => void; options: { value: T; label?: string; icon?: string }[] }) {
  const id = useId();
  return (
    <div className="inline-flex p-[3px] gap-0.5 bg-surface-3 rounded-sm border border-line">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={cx("h-[30px] px-3.5 rounded-md text-[13px] font-medium inline-flex items-center gap-1.5 relative",
            value === o.value ? "text-text" : "text-text-2 hover:text-text")}>
          {value === o.value && (
            <motion.div
              layoutId={`seg-${id}`}
              className="absolute inset-0 bg-surface rounded-md shadow-xs pointer-events-none"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-[1] inline-flex items-center gap-1.5">
            {o.icon && <Icon name={o.icon} size={15} />}{o.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ Avatar ------------------------------- */
export function Avatar({ name, side, size, className }: { name: string; side?: "A" | "B"; size?: "sm" | "lg"; className?: string }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span title={name} className={cx("inline-flex items-center justify-center rounded-full font-semibold shrink-0 border border-surface",
      side === "B" ? "bg-gold-soft text-[var(--gold-ink)]" : "bg-primary-soft text-primary-700",
      size === "sm" ? "w-7 h-7 text-[11px]" : size === "lg" ? "w-12 h-12 text-base" : "w-9 h-9 text-[13px]",
      className)}>{initials}</span>
  );
}

/* ----------------------------- Progress ------------------------------ */
export function Progress({ value, tone = "primary", thin }: { value: number; tone?: "primary" | "sage" | "coral" | "gold"; thin?: boolean }) {
  const bg = { primary: "bg-primary", sage: "bg-sage", coral: "bg-coral", gold: "bg-gold" }[tone];
  return (
    <div className={cx("progress-track", thin ? "h-[5px]" : "h-2")}>
      <span className={cx("block h-full rounded-full transition-[width] duration-500", bg)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/* ------------------------------- Ring -------------------------------- */
export function Ring({ value, size = 120, stroke = 10, color = "var(--primary)", track = "var(--surface-3)", children }:
  { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ------------------------------ Donut -------------------------------- */
export function Donut({ data, size = 180, stroke = 26, onHover }:
  { data: { value: number; color: string; id?: any; label?: string }[]; size?: number; stroke?: number; onHover?: (d: any) => void }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {data.map((d, i) => {
          const dash = (d.value / total) * c;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-acc}
              onMouseEnter={onHover ? () => onHover(d) : undefined} onMouseLeave={onHover ? () => onHover(null) : undefined}
              style={{ cursor: onHover ? "pointer" : "default" }} />
          );
          acc += dash;
          return el;
        })}
      </g>
    </svg>
  );
}

/* ------------------------------ Modal -------------------------------- */
export function Modal({ title, onClose, children, footer, lg }:
  { title: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; lg?: boolean }) {
  const [visible, setVisible] = useState(true);

  const handleClose = useCallback(() => setVisible(false), []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [handleClose]);

  return (
    <AnimatePresence onExitComplete={onClose}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[3px] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18, ease: "easeIn" } }}
          transition={{ duration: 0.22 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            className={cx("bg-surface border border-line rounded-card shadow-lg w-full max-h-[88vh] overflow-auto", lg ? "max-w-3xl" : "max-w-lg")}
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.18, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-line sticky top-0 bg-surface z-[2]">
              <div className="text-[17px] font-semibold">{title}</div>
              <IconButton name="x" size="sm" onClick={handleClose} />
            </div>
            <div className="p-6">{children}</div>
            {footer && <div className="flex gap-3 justify-end px-6 py-4 border-t border-line sticky bottom-0 bg-surface">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------ Drawer ------------------------------- */
export function Drawer({ title, onClose, children, footer }:
  { title: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  const [visible, setVisible] = useState(true);

  const handleClose = useCallback(() => setVisible(false), []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [handleClose]);

  return (
    <AnimatePresence onExitComplete={onClose}>
      {visible && (
        <>
          <motion.div
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
            transition={{ duration: 0.22 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed top-0 right-0 bottom-0 z-[201] w-[min(460px,92vw)] bg-surface border-l border-line shadow-lg flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%", transition: { type: "spring", stiffness: 400, damping: 38 } }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-line">
              <div className="text-[17px] font-semibold">{title}</div>
              <IconButton name="x" size="sm" onClick={handleClose} />
            </div>
            <div className="flex-1 overflow-auto p-6">{children}</div>
            {footer && <div className="px-6 py-4 border-t border-line flex gap-3">{footer}</div>}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------ Empty -------------------------------- */
export function Empty({ icon = "sparkle", title, children, action }:
  { icon?: string; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6 gap-3">
      <div className="w-24 h-24 rounded-full flex items-center justify-center bg-primary-softer text-primary mb-2">
        <Icon name={icon} size={40} strokeWidth={1.4} />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {children && <p className="text-sm text-text-2 max-w-sm">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ------------------------------- Tabs -------------------------------- */
export function Tabs({ tabs, value, onChange }: { tabs: { id: string; label: string }[]; value: string; onChange: (id: string) => void }) {
  const id = useId();
  return (
    <div className="flex gap-0.5 border-b border-line overflow-x-auto">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={cx("px-4 py-3 text-sm font-medium whitespace-nowrap transition relative",
            value === t.id ? "text-primary" : "text-text-2 hover:text-text")}>
          {t.label}
          {value === t.id && (
            <motion.div
              layoutId={`tabs-${id}`}
              className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-t-sm"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
