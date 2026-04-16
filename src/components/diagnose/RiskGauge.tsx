import type { RiskTier } from "@/lib/risk-utils";
import { tierLabel } from "@/lib/risk-utils";

export function RiskGauge({ risk, tier, confidence }: { risk: number; tier: RiskTier; confidence: number | null }) {
  const r = 78;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(Math.max(risk, 0), 100) / 100) * c;
  const stroke =
    tier === "high" ? "var(--primary)" : tier === "mid" ? "var(--amber)" : "var(--sage)";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--border)" strokeWidth="2" />
        <circle
          cx="100" cy="100" r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          style={{ transition: "stroke-dasharray 800ms cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="display-numeral text-[64px]" style={{ color: stroke }}>{risk}<span className="text-2xl align-top">%</span></div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink3">{tierLabel(tier)}</div>
        {confidence !== null && (
          <div className="mt-2 font-mono text-[10px] text-ink4">conf · {Math.round(confidence * 100)}%</div>
        )}
      </div>
    </div>
  );
}
