import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type WeightUnit = "kg" | "lb";
export type HeightUnit = "cm" | "in";
export type SortPref = "created_at" | "risk_score" | "patient_name" | "bmi";

export type Settings = {
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  defaultSort: SortPref;
};

const DEFAULTS: Settings = { weightUnit: "kg", heightUnit: "cm", defaultSort: "created_at" };
const KEY = "cardiosense:settings";

type Ctx = Settings & { update: (s: Partial<Settings>) => void; reset: () => void };
const SettingsCtx = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  const update = (patch: Partial<Settings>) => {
    setS((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };
  const reset = () => { localStorage.removeItem(KEY); setS(DEFAULTS); };

  return <SettingsCtx.Provider value={{ ...s, update, reset }}>{children}</SettingsCtx.Provider>;
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

// Conversion helpers (always store metric in DB; convert only at the UI boundary)
export const kgToLb = (kg: number) => kg * 2.20462;
export const lbToKg = (lb: number) => lb / 2.20462;
export const cmToIn = (cm: number) => cm / 2.54;
export const inToCm = (inches: number) => inches * 2.54;

export const formatWeight = (kg: number, unit: WeightUnit) =>
  unit === "lb" ? `${kgToLb(kg).toFixed(1)} lb` : `${kg.toFixed(1)} kg`;
export const formatHeight = (cm: number, unit: HeightUnit) =>
  unit === "in" ? `${cmToIn(cm).toFixed(1)} in` : `${cm.toFixed(0)} cm`;
