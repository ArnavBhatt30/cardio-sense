import { useMemo, useState } from "react";

export type TrendPoint = {
  t: number; // unix ms
  v: number; // risk score 0-100
  tier: "low" | "mid" | "high";
};

export function RiskTrendChart({
  data,
  height = 220,
}: {
  data: TrendPoint[];
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 800;
  const H = height;
  const padL = 36;
  const padR = 12;
  const padT = 16;
  const padB = 28;

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const sorted = useMemo(() => [...data].sort((a, b) => a.t - b.t), [data]);

  if (sorted.length < 2) {
    return (
      <div
        className="grid place-items-center rounded-xl border border-dashed border-border text-center font-mono text-[11px] uppercase tracking-widest text-ink3"
        style={{ height: H }}
      >
        — need ≥ 2 scans to plot a trend —
      </div>
    );
  }

  const tMin = sorted[0].t;
  const tMax = sorted[sorted.length - 1].t;
  const tRange = tMax - tMin || 1;

  const x = (t: number) => padL + ((t - tMin) / tRange) * innerW;
  const y = (v: number) => padT + (1 - v / 100) * innerH;

  const pathLine = sorted
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`)
    .join(" ");
  const pathArea = `${pathLine} L${x(tMax).toFixed(1)},${padT + innerH} L${x(tMin).toFixed(1)},${padT + innerH} Z`;

  const yTicks = [0, 25, 50, 75, 100];

  // x ticks: 4 evenly spaced
  const xTickCount = Math.min(5, sorted.length);
  const xTicks = Array.from({ length: xTickCount }, (_, i) => {
    const t = tMin + (tRange * i) / (xTickCount - 1);
    return t;
  });

  const hovered = hover !== null ? sorted[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-auto w-full"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* y-axis grid + labels */}
        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--border)"
              strokeDasharray={v === 0 || v === 100 ? "0" : "2 4"}
            />
            <text
              x={padL - 8}
              y={y(v) + 3}
              textAnchor="end"
              className="fill-[var(--ink3)] font-mono"
              style={{ fontSize: 9, letterSpacing: "0.1em" }}
            >
              {v}
            </text>
          </g>
        ))}

        {/* tier bands (subtle) */}
        <rect x={padL} y={y(100)} width={innerW} height={y(65) - y(100)} fill="var(--primary)" opacity="0.04" />
        <rect x={padL} y={y(65)} width={innerW} height={y(35) - y(65)} fill="var(--amber)" opacity="0.05" />
        <rect x={padL} y={y(35)} width={innerW} height={y(0) - y(35)} fill="var(--sage)" opacity="0.05" />

        {/* area + line */}
        <path d={pathArea} fill="url(#trend-fill)" />
        <path
          d={pathLine}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* points */}
        {sorted.map((p, i) => {
          const c =
            p.tier === "high" ? "var(--primary)" : p.tier === "mid" ? "var(--amber)" : "var(--sage)";
          const isHover = hover === i;
          return (
            <g key={i}>
              <circle
                cx={x(p.t)}
                cy={y(p.v)}
                r={isHover ? 4.5 : 2.5}
                fill="var(--background)"
                stroke={c}
                strokeWidth="1.6"
              />
              {/* invisible hit target */}
              <rect
                x={x(p.t) - 12}
                y={padT}
                width={24}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
            </g>
          );
        })}

        {/* hover crosshair */}
        {hovered && (
          <line
            x1={x(hovered.t)}
            x2={x(hovered.t)}
            y1={padT}
            y2={padT + innerH}
            stroke="var(--foreground)"
            strokeOpacity="0.25"
            strokeDasharray="3 3"
          />
        )}

        {/* x ticks */}
        {xTicks.map((t, i) => (
          <text
            key={i}
            x={x(t)}
            y={H - 8}
            textAnchor="middle"
            className="fill-[var(--ink3)] font-mono"
            style={{ fontSize: 9, letterSpacing: "0.1em" }}
          >
            {formatTick(t, tRange)}
          </text>
        ))}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-md border border-border bg-card px-3 py-2 shadow-md"
          style={{
            left: `${(x(hovered.t) / W) * 100}%`,
            top: `${(y(hovered.v) / H) * 100}%`,
            transform: "translate(-50%, calc(-100% - 12px))",
          }}
        >
          <div className="font-mono text-[9px] uppercase tracking-widest text-ink3">
            {new Date(hovered.t).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div className="display-numeral text-xl" style={{ color: tierColor(hovered.tier) }}>
            {hovered.v}
            <span className="ml-0.5 text-[10px] align-top text-ink3">%</span>
          </div>
        </div>
      )}
    </div>
  );
}

function tierColor(t: "low" | "mid" | "high") {
  return t === "high" ? "var(--primary)" : t === "mid" ? "var(--amber)" : "var(--sage)";
}

function formatTick(t: number, range: number) {
  const d = new Date(t);
  if (range > 1000 * 60 * 60 * 24 * 5) {
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  }
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
