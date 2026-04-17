import { useEffect, useRef, useState } from "react";

/**
 * Animated ECG-style waveform. Pure SVG, no canvas.
 * Generates a continuous P-QRS-T morphology that scrolls right-to-left.
 */
export function EcgPulse({
  bpm = 68,
  height = 140,
  color = "var(--primary)",
  label = "Live sinus rhythm",
}: {
  bpm?: number;
  height?: number;
  color?: string;
  label?: string;
}) {
  const [points, setPoints] = useState<number[]>(() => Array(240).fill(0));
  const [tick, setTick] = useState(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    // samples per second; tied loosely to bpm so the QRS spike repeats correctly
    const sampleRate = 60; // ~60 samples/sec scrolling
    const samplesPerBeat = Math.round((60 / bpm) * sampleRate);

    const loop = (t: number) => {
      const dt = t - last;
      if (dt > 1000 / sampleRate) {
        last = t;
        phaseRef.current = (phaseRef.current + 1) % samplesPerBeat;
        const v = ecgValue(phaseRef.current, samplesPerBeat);
        setPoints((prev) => {
          const next = prev.slice(1);
          next.push(v);
          return next;
        });
        setTick((n) => (n + 1) % 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [bpm]);

  const W = 600;
  const H = height;
  const midY = H / 2;
  const stepX = W / (points.length - 1);
  const path = points
    .map((v, i) => {
      const x = i * stepX;
      const y = midY - v * (H * 0.38);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const lastY = midY - points[points.length - 1] * (H * 0.38);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-[var(--bone2)]/30">
      {/* grid */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-full w-full"
        style={{ height: H }}
      >
        <defs>
          <pattern id="ecg-grid-sm" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="var(--border)" strokeWidth="0.5" />
          </pattern>
          <pattern id="ecg-grid-lg" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="var(--border)" strokeWidth="1" />
          </pattern>
          <linearGradient id="ecg-fade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--bone2)" stopOpacity="1" />
            <stop offset="8%" stopColor="var(--bone2)" stopOpacity="0" />
            <stop offset="92%" stopColor="var(--bone2)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--bone2)" stopOpacity="0.6" />
          </linearGradient>
          <filter id="ecg-glow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={W} height={H} fill="url(#ecg-grid-sm)" opacity="0.5" />
        <rect width={W} height={H} fill="url(#ecg-grid-lg)" opacity="0.5" />

        {/* baseline */}
        <line
          x1="0"
          x2={W}
          y1={midY}
          y2={midY}
          stroke="var(--border)"
          strokeDasharray="2 4"
        />

        {/* trace */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#ecg-glow)"
        />

        {/* leading dot */}
        <circle cx={W - 1} cy={lastY} r="3" fill={color}>
          <animate attributeName="r" values="3;5;3" dur="0.9s" repeatCount="indefinite" />
        </circle>

        <rect width={W} height={H} fill="url(#ecg-fade)" />
      </svg>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-0 flex items-start justify-between p-3 font-mono text-[10px] uppercase tracking-widest">
        <div className="flex items-center gap-2 text-ink3">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-3 text-ink3">
          <span>
            <span className="display-numeral text-base text-foreground">{bpm}</span> bpm
          </span>
          <span className="hidden sm:inline">{tick.toString().padStart(3, "0")}</span>
        </div>
      </div>
    </div>
  );
}

/** Synthesizes a single ECG sample: P, QRS, T components. Output ≈ [-0.4, 1] */
function ecgValue(i: number, period: number): number {
  const x = i / period; // 0..1
  // P wave
  const P = 0.18 * gauss(x, 0.18, 0.022);
  // Q dip
  const Q = -0.18 * gauss(x, 0.34, 0.012);
  // R spike
  const R = 1.0 * gauss(x, 0.38, 0.012);
  // S dip
  const S = -0.32 * gauss(x, 0.42, 0.014);
  // T wave
  const T = 0.32 * gauss(x, 0.62, 0.04);
  // small baseline noise for realism
  const noise = (Math.sin(i * 0.7) + Math.cos(i * 1.3)) * 0.006;
  return P + Q + R + S + T + noise;
}

function gauss(x: number, mu: number, sigma: number) {
  const d = x - mu;
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}
