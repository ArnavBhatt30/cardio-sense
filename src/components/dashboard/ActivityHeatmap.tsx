import { useMemo, useState } from "react";

type Scan = { created_at: string; risk_score: number };

/**
 * GitHub/LeetCode-style activity heatmap.
 * Columns = weeks, rows = days of the week (Mon..Sun).
 * Cell intensity = number of scans that day.
 * Cell hue = mean risk tier of that day's scans.
 */
export function ActivityHeatmap({
  scans,
  weeks = 18,
}: {
  scans: Scan[];
  weeks?: number;
}) {
  const [hover, setHover] = useState<{ x: number; y: number; day: DayCell } | null>(null);

  const { grid, monthLabels, totalScans, activeDays, maxCount } = useMemo(
    () => buildGrid(scans, weeks),
    [scans, weeks],
  );

  const cell = 14;
  const gap = 3;
  const dayLabelW = 22;
  const monthLabelH = 16;
  const W = dayLabelW + weeks * (cell + gap);
  const H = monthLabelH + 7 * (cell + gap);

  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];

  return (
    <div className="rounded-xl border border-border bg-[var(--bone2)]/30 p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink3">
          {totalScans} scan{totalScans === 1 ? "" : "s"} · {activeDays} active day
          {activeDays === 1 ? "" : "s"} · last {weeks} weeks
        </div>
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-ink3">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <span
              key={lvl}
              className="h-3 w-3 rounded-[3px] border border-border/60"
              style={{ background: levelColor(lvl, "var(--primary)") }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg width={W} height={H} className="block">
          {/* month labels */}
          {monthLabels.map((m, i) => (
            <text
              key={i}
              x={dayLabelW + m.col * (cell + gap)}
              y={11}
              className="fill-[var(--ink3)] font-mono"
              style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              {m.label}
            </text>
          ))}

          {/* day-of-week labels */}
          {dayLabels.map((d, i) =>
            d ? (
              <text
                key={i}
                x={0}
                y={monthLabelH + i * (cell + gap) + cell - 3}
                className="fill-[var(--ink3)] font-mono"
                style={{ fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                {d}
              </text>
            ) : null,
          )}

          {/* cells */}
          {grid.map((col, ci) =>
            col.map((day, ri) => {
              if (!day) return null;
              const x = dayLabelW + ci * (cell + gap);
              const y = monthLabelH + ri * (cell + gap);
              const lvl = bucket(day.count, maxCount);
              const tone =
                day.count === 0
                  ? "var(--border)"
                  : day.avgTier === "high"
                    ? "var(--primary)"
                    : day.avgTier === "mid"
                      ? "var(--amber)"
                      : "var(--sage)";
              return (
                <rect
                  key={`${ci}-${ri}`}
                  x={x}
                  y={y}
                  width={cell}
                  height={cell}
                  rx={3}
                  ry={3}
                  fill={day.count === 0 ? "var(--bone2)" : levelColor(lvl, tone)}
                  stroke="var(--border)"
                  strokeOpacity={day.count === 0 ? 0.5 : 0.25}
                  onMouseEnter={() => setHover({ x: x + cell / 2, y, day })}
                  onMouseLeave={() => setHover(null)}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                />
              );
            }),
          )}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-border bg-card px-3 py-2 shadow-lg"
            style={{ left: hover.x, top: Math.max(hover.y - 8, 0), transform: "translate(-50%, -100%)" }}
          >
            <div className="font-mono text-[9px] uppercase tracking-widest text-ink3">
              {new Date(hover.day.date).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })}
            </div>
            {hover.day.count === 0 ? (
              <div className="text-sm text-ink2">No scans</div>
            ) : (
              <div className="text-sm">
                <span className="display-numeral text-base">{hover.day.count}</span> scan
                {hover.day.count === 1 ? "" : "s"} · avg{" "}
                <span style={{ color: tierVar(hover.day.avgTier) }}>{Math.round(hover.day.avgRisk)}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type DayCell = {
  date: string; // yyyy-mm-dd
  count: number;
  avgRisk: number;
  avgTier: "low" | "mid" | "high";
};

function buildGrid(scans: Scan[], weeks: number) {
  // bucket scans by yyyy-mm-dd
  const byDay = new Map<string, { sum: number; count: number }>();
  for (const s of scans) {
    const k = ymd(new Date(s.created_at));
    const cur = byDay.get(k) ?? { sum: 0, count: 0 };
    cur.sum += s.risk_score;
    cur.count += 1;
    byDay.set(k, cur);
  }

  // anchor: end of this week (Sunday). We render `weeks` columns ending today's week.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // shift today to its Monday-of-week
  const dayIdx = (today.getDay() + 6) % 7; // 0=Mon..6=Sun
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - dayIdx);

  const grid: (DayCell | null)[][] = [];
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;

  let totalScans = 0;
  let activeDays = 0;
  let maxCount = 0;

  for (let w = weeks - 1; w >= 0; w--) {
    const colDate = new Date(thisMonday);
    colDate.setDate(thisMonday.getDate() - w * 7);
    const col: (DayCell | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(colDate);
      cellDate.setDate(colDate.getDate() + d);
      // hide future cells
      if (cellDate > today) {
        col.push(null);
        continue;
      }
      const k = ymd(cellDate);
      const agg = byDay.get(k);
      const count = agg?.count ?? 0;
      const avgRisk = agg ? agg.sum / agg.count : 0;
      const avgTier: "low" | "mid" | "high" = avgRisk >= 65 ? "high" : avgRisk >= 35 ? "mid" : "low";
      if (count > 0) {
        totalScans += count;
        activeDays += 1;
        if (count > maxCount) maxCount = count;
      }
      col.push({ date: k, count, avgRisk, avgTier });
    }
    const colIdx = weeks - 1 - w;
    const m = colDate.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({
        col: colIdx,
        label: colDate.toLocaleString("en-GB", { month: "short" }),
      });
      lastMonth = m;
    }
    grid.push(col);
  }

  return { grid, monthLabels, totalScans, activeDays, maxCount: Math.max(maxCount, 1) };
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function bucket(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  const r = count / max;
  if (r <= 0.25) return 1;
  if (r <= 0.5) return 2;
  if (r <= 0.75) return 3;
  return 4;
}

function levelColor(lvl: number, base: string) {
  // Use color-mix to fade base toward bone2 for lower intensity
  const pct = [0, 25, 50, 75, 100][lvl] ?? 0;
  return `color-mix(in oklab, ${base} ${pct}%, var(--bone2))`;
}

function tierVar(t: "low" | "mid" | "high") {
  return t === "high" ? "var(--primary)" : t === "mid" ? "var(--amber)" : "var(--sage)";
}
