"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useI18n, LOCALE_LABELS, LOCALE_FLAGS, type Locale } from "@/lib/i18n";

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted hover:text-white hover:bg-white/5 transition-all"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{LOCALE_FLAGS[locale]}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 glass-card rounded-xl border border-card-border overflow-hidden z-50 min-w-[140px]">
          {(Object.keys(LOCALE_LABELS) as Locale[]).map((loc) => (
            <button
              key={loc}
              onClick={() => {
                setLocale(loc);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                locale === loc
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{LOCALE_FLAGS[loc]}</span>
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
