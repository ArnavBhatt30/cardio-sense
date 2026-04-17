import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowRight, Activity, TrendingDown, TrendingUp } from "lucide-react";
import { SkeletonBlock } from "@/components/ui/skeleton-row";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { RiskTrendChart, type TrendPoint } from "@/components/dashboard/RiskTrendChart";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard — CardioSense" },
      { name: "description", content: "Live cardiovascular risk monitoring." },
    ],
  }),
});

type Row = {
  id: string;
  patient_name: string;
  risk_score: number;
  risk_tier: "low" | "mid" | "high";
  bmi: number;
  ap_hi: number;
  ap_lo: number;
  created_at: string;
};

function DashboardPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [pulseFlash, setPulseFlash] = useState(false);

  // bootstrap auth + initial fetch
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      if (!active) return;
      setAuthed(true);
      setEmail(data.session.user.email ?? null);
      setUserId(data.session.user.id);
      const { data: recs, error } = await supabase
        .from("patient_records")
        .select("id,patient_name,risk_score,risk_tier,bmi,ap_hi,ap_lo,created_at")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(error.message);
        setRows([]);
      } else setRows(recs as Row[]);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  // realtime subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`patient_records:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "patient_records", filter: `user_id=eq.${userId}` },
        (payload) => {
          const r = payload.new as Row;
          setRows((prev) => (prev ? [r, ...prev] : [r]));
          setPulseFlash(true);
          setTimeout(() => setPulseFlash(false), 1200);
          toast.success(`New scan: ${r.patient_name} · ${r.risk_score}%`);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "patient_records", filter: `user_id=eq.${userId}` },
        (payload) => {
          const old = payload.old as { id: string };
          setRows((prev) => prev?.filter((r) => r.id !== old.id) ?? null);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const stats = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    const total = rows.length;
    const avg = Math.round(rows.reduce((a, r) => a + r.risk_score, 0) / total);
    const high = rows.filter((r) => r.risk_tier === "high").length;
    const mid = rows.filter((r) => r.risk_tier === "mid").length;
    const low = rows.filter((r) => r.risk_tier === "low").length;
    const avgBmi = rows.reduce((a, r) => a + Number(r.bmi), 0) / total;
    const avgSys = Math.round(rows.reduce((a, r) => a + r.ap_hi, 0) / total);

    // trend delta: last 5 vs prior 5
    const recent = rows.slice(0, 5);
    const prior = rows.slice(5, 10);
    const recentAvg = recent.length ? recent.reduce((a, r) => a + r.risk_score, 0) / recent.length : 0;
    const priorAvg = prior.length ? prior.reduce((a, r) => a + r.risk_score, 0) / prior.length : recentAvg;
    const delta = Math.round(recentAvg - priorAvg);

    return { total, avg, high, mid, low, avgBmi, avgSys, delta };
  }, [rows]);

  const trendData: TrendPoint[] = useMemo(
    () =>
      (rows ?? []).map((r) => ({
        t: new Date(r.created_at).getTime(),
        v: r.risk_score,
        tier: r.risk_tier,
      })),
    [rows],
  );

  // baseline bpm from cohort avg risk; modulated live below
  const baseBpm = useMemo(() => {
    if (!stats) return 68;
    return Math.round(60 + (stats.avg / 100) * 40);
  }, [stats]);

  // live ticker — 1Hz heartbeat for the HUD (seconds since mount, last-update)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // bpm wanders ±3 around baseline every 4s — physiological variability
  const [bpm, setBpm] = useState(baseBpm);
  useEffect(() => {
    setBpm(baseBpm);
    const id = window.setInterval(() => {
      setBpm(baseBpm + Math.round((Math.random() - 0.5) * 6));
    }, 4000);
    return () => window.clearInterval(id);
  }, [baseBpm]);

  const lastScanAt = rows && rows[0] ? new Date(rows[0].created_at).getTime() : null;
  const sinceLast = lastScanAt ? Math.max(0, Math.floor((now - lastScanAt) / 1000)) : null;

  if (!authed) return null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      {/* header */}
      <div className="mb-10 grid items-end gap-6 md:mb-14 md:grid-cols-12">
        <div className="md:col-span-7">
          <div className="eyebrow eyebrow-dot mb-3">Live overview</div>
          <h1>
            {greeting()}, <em>{email?.split("@")[0] ?? "clinician"}</em>
          </h1>
        </div>
        <div className="md:col-span-5 md:text-right">
          <Button asChild>
            <Link to="/diagnose">
              New diagnosis <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {rows === null ? (
        <div className="space-y-6">
          <SkeletonBlock className="h-[200px] w-full rounded-xl" />
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card p-7">
                <SkeletonBlock className="h-10 w-24" />
                <SkeletonBlock className="mt-3 h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* HERO: live ECG + risk trend */}
          <section
            className={`mb-10 rounded-2xl border border-border bg-card p-5 md:p-7 transition-shadow duration-700 ${
              pulseFlash ? "shadow-[0_0_0_2px_var(--primary)]" : ""
            }`}
          >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="eyebrow eyebrow-dot mb-1.5">
                  <Activity className="mr-1 inline h-3 w-3" />
                  Realtime monitor
                </div>
                <h2 className="font-serif text-2xl tracking-tight md:text-3xl">
                  Cohort vitals · <em className="text-primary">live</em>
                </h2>
              </div>
              <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-widest text-ink3">
                <div>
                  <div>Avg risk</div>
                  <div className="display-numeral text-2xl text-foreground">{stats!.avg}%</div>
                </div>
                <div>
                  <div>Avg SYS</div>
                  <div className="display-numeral text-2xl text-foreground">{stats!.avgSys}</div>
                </div>
                <div>
                  <div>Delta</div>
                  <div
                    className="display-numeral flex items-center gap-1 text-2xl"
                    style={{
                      color:
                        stats!.delta > 2
                          ? "var(--primary)"
                          : stats!.delta < -2
                            ? "var(--sage)"
                            : "var(--foreground)",
                    }}
                  >
                    {stats!.delta > 0 ? "+" : ""}
                    {stats!.delta}
                    {stats!.delta > 2 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : stats!.delta < -2 ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* live status strip */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-bone2/40 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="text-foreground">LIVE</span>
                <span>· streaming from cohort</span>
              </div>
              <div className="flex items-center gap-4">
                <span>
                  BPM <span className="display-numeral text-foreground">{bpm}</span>
                </span>
                <span>
                  Last scan{" "}
                  <span className="text-foreground">
                    {sinceLast === null ? "—" : formatSince(sinceLast)}
                  </span>
                </span>
                <span className="hidden sm:inline">
                  {new Date(now).toLocaleTimeString("en-GB", { hour12: false })}
                </span>
              </div>
            </div>

            {/* Activity heatmap — daily scan volume × avg risk tier */}
            <ActivityHeatmap scans={rows!.map((r) => ({ created_at: r.created_at, risk_score: r.risk_score }))} weeks={18} />

            {/* Trend chart */}
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="eyebrow">Risk score timeline · all scans</div>
                <div className="hidden items-center gap-3 font-mono text-[9px] uppercase tracking-widest text-ink3 sm:flex">
                  <Legend color="var(--sage)" label="Low" />
                  <Legend color="var(--amber)" label="Moderate" />
                  <Legend color="var(--primary)" label="High" />
                </div>
              </div>
              <RiskTrendChart data={trendData} height={240} />
            </div>
          </section>

          {/* stat band */}
          <section className="mb-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
            <Metric n={String(stats!.total)} label="Total scans" />
            <Metric
              n={`${stats!.avg}%`}
              label="Average risk"
              tint={stats!.avg > 65 ? "primary" : stats!.avg > 35 ? "amber" : "sage"}
            />
            <Metric n={stats!.avgBmi.toFixed(1)} label="Average BMI" />
            <Metric
              n={`${stats!.high}`}
              label="High-risk patients"
              tint={stats!.high > 0 ? "primary" : undefined}
            />
          </section>

          {/* distribution + recent */}
          <section className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="surface-raised p-8">
                <div className="eyebrow mb-6">Tier distribution</div>
                <Donut high={stats!.high} mid={stats!.mid} low={stats!.low} />
                <div className="mt-8 space-y-3">
                  {[
                    ["Low", stats!.low, "sage"],
                    ["Moderate", stats!.mid, "amber"],
                    ["High", stats!.high, "primary"],
                  ].map(([label, count, c]) => (
                    <div
                      key={String(label)}
                      className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                    >
                      <span className="flex items-center gap-2 text-sm text-ink2">
                        <span className="h-2 w-2 rounded-full" style={{ background: `var(--${c as string})` }} />
                        {label}
                      </span>
                      <span className="font-mono text-xs">
                        {String(count)} · {Math.round((Number(count) / stats!.total) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="surface-raised overflow-hidden">
                <div className="flex items-center justify-between border-b border-border bg-bone2/40 px-6 py-4">
                  <div className="eyebrow">Most recent</div>
                  <Link to="/history" className="font-mono text-[10px] uppercase tracking-widest text-primary">
                    View all →
                  </Link>
                </div>
                <ul className="divide-y divide-border">
                  {rows.slice(0, 6).map((r) => {
                    const c = r.risk_tier === "high" ? "primary" : r.risk_tier === "mid" ? "amber" : "sage";
                    return (
                      <li key={r.id} className="flex items-center justify-between px-6 py-4">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{r.patient_name}</div>
                          <div className="font-mono text-[10px] uppercase tracking-widest text-ink3">
                            {new Date(r.created_at).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            · BMI {Number(r.bmi).toFixed(1)} · SYS {r.ap_hi}
                          </div>
                        </div>
                        <div className="display-numeral text-3xl" style={{ color: `var(--${c})` }}>
                          {r.risk_score}
                          <span className="align-top text-xs">%</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function formatSince(s: number) {
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Metric({ n, label, tint }: { n: string; label: string; tint?: string }) {
  return (
    <div className="bg-card px-6 py-7">
      <div className="display-numeral text-4xl" style={tint ? { color: `var(--${tint})` } : undefined}>
        {n}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink3">{label}</div>
    </div>
  );
}

function Donut({ high, mid, low }: { high: number; mid: number; low: number }) {
  const total = high + mid + low || 1;
  const r = 60;
  const c = 2 * Math.PI * r;
  const segs = [
    { v: low, color: "var(--sage)" },
    { v: mid, color: "var(--amber)" },
    { v: high, color: "var(--primary)" },
  ];
  let acc = 0;
  return (
    <div className="relative mx-auto h-44 w-44">
      <svg viewBox="0 0 160 160" className="-rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--border)" strokeWidth="14" />
        {segs.map((s, i) => {
          const len = (s.v / total) * c;
          const offset = -acc;
          acc += len;
          return (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="display-numeral text-3xl">{total}</div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-ink3">scans</div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="surface-raised flex flex-col items-center px-8 py-20 text-center">
      <div className="mb-6 w-full max-w-md">
        <ActivityHeatmap scans={[]} weeks={12} />
      </div>
      <h2 className="mb-3">
        No data <em>yet</em>
      </h2>
      <p className="mb-8 max-w-md text-ink2">
        Run your first patient diagnostic to populate the dashboard with live risk scores, tier distribution, and a
        real-time trend chart.
      </p>
      <Button asChild size="lg">
        <Link to="/diagnose">Run first diagnosis →</Link>
      </Button>
    </div>
  );
}
