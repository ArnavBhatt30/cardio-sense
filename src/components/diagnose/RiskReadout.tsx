import type { Result } from "@/lib/risk-utils";
import { RiskGauge } from "./RiskGauge";

export function RiskReadout({ r }: { r: Result }) {
  return (
    <div className="surface-raised mt-12 overflow-hidden">
      <div className="grid items-center gap-8 border-b border-border bg-bone2/30 p-10 md:grid-cols-[auto_1fr]">
        <RiskGauge risk={r.risk} tier={r.tier} confidence={r.confidence} />
        <div>
          <div className="eyebrow eyebrow-dot mb-3">Cardiovascular risk readout</div>
          <h2 className="mb-3">
            {r.tier === "high" ? <>Elevated <em>risk</em> detected.</>
              : r.tier === "mid" ? <>Moderate <em>risk</em> profile.</>
              : <>Risk profile within <em>normal</em> range.</>}
          </h2>
          <p className="text-ink2">
            BMI <span className="font-mono">{r.bmi.toFixed(1)}</span> · {r.notes.length} clinical
            note{r.notes.length === 1 ? "" : "s"} generated · saved to history.
          </p>
        </div>
      </div>

      <div className="grid gap-12 p-10 md:grid-cols-2">
        <div>
          <div className="eyebrow mb-5">Vitals overview</div>
          <div className="space-y-5">
            {r.vitals.map((v) => {
              const color = v.status === "bad" ? "var(--primary)" : v.status === "warn" ? "var(--amber)" : "var(--sage)";
              return (
                <div key={v.name}>
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="text-ink2">{v.name}</span>
                    <span className="font-mono text-xs" style={{ color }}>{v.value}</span>
                  </div>
                  <div className="relative h-1 overflow-hidden rounded-full bg-bone2">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${v.pct}%`, background: color, transition: "width 600ms ease-out" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="eyebrow mb-5">Clinical notes</div>
          <ul className="space-y-2.5">
            {r.notes.map((n, i) => {
              const c = n.kind === "danger" ? "primary" : n.kind === "warn" ? "amber" : "sage";
              return (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-md border px-4 py-3 text-sm"
                  style={{
                    borderColor: `color-mix(in oklab, var(--${c}) 25%, transparent)`,
                    background: `color-mix(in oklab, var(--${c}) 5%, transparent)`,
                  }}
                >
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: `var(--${c})` }} />
                  <span style={{ color: `var(--${c})` }}>{n.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
