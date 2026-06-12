"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Optional display transform for each option (raw value stays the same). */
  labelFor?: (v: string) => string;
  placeholder?: string;
}

/** Compact multi-select dropdown with checkboxes; closes on outside click. */
export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
  labelFor,
  placeholder = "Any",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (options.length === 0) return null;

  const show = (v: string) => labelFor?.(v) ?? v;

  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  }

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? show(selected[0])
      : `${selected.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
        {label}
      </p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white hover:border-brand-blue transition-colors"
      >
        <span className={`truncate ${selected.length ? "text-brand-navy font-medium" : "text-gray-400"}`}>
          {summary}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg py-1">
          {options.map((opt) => {
            const on = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${on ? "bg-brand-navy border-brand-navy" : "border-gray-300"}`}>
                  {on && <Check className="w-3 h-3 text-white" />}
                </span>
                <span className="truncate text-gray-700">{show(opt)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
