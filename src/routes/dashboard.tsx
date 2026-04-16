import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { SkeletonBlock } from "@/components/ui/skeleton-row";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard — CardioSense" },
      { name: "description", content: "Your cardiovascular risk overview." },
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
  created_at: string;
};

function DashboardPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { navigate({ to: "/auth" }); return; }
      if (!active) return;
      setAuthed(true);
      setEmail(data.session.user.email ?? null);
      const { data: recs, error } = await supabase
        .from("patient_records")
        .select("id,patient_name,risk_score,risk_tier,bmi,ap_hi,created_at")
        .order("created_at", { ascending: false });
      if (error) { toast.error(error.message); setRows([]); }
      else setRows(recs as Row[]);
    });
    return () => { active = false; };
  }, [navigate]);

  const stats = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    const total = rows.length;
    const avg = Math.round(rows.reduce((a, r) => a + r.risk_score, 0) / total);
    const high = rows.filter((r) => r.risk_tier === "high").length;
    const mid = rows.filter((r) => r.risk_tier === "mid").length;
    const low = rows.filter((r) => r.risk_tier === "low").length;
    const avgBmi = (rows.reduce((a, r) => a + Number(r.bmi), 0) / total);
    return { total, avg, high, mid, low, avgBmi };
  }, [rows]);

  if (!authed) return null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-14 grid items-end gap-6 md:grid-cols-12">
        <div className="md:col-span-7">
          <div className="eyebrow eyebrow-dot mb-3">Overview</div>
          <h1>
            {greeting()}, <em>{email?.split("@")[0] ?? "clinician"}</em>
          </h1>
        </div>
        <div className="md:col-span-5 md:text-right">
          <Button asChild>
            <Link to="/diagnose">New diagnosis <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>

      {rows === null ? (
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card p-7"><SkeletonBlock className="h-10 w-24" /><SkeletonBlock className="mt-3 h-3 w-32" /></div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* stat band */}
          <section className="mb-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
            <Metric n={String(stats!.total)} label="Total scans" />
            <Metric n={`${stats!.avg}%`} label="Average risk" tint={
              stats!.avg > 65 ? "primary" : stats!.avg > 35 ? "amber" : "sage"
            } />
            <Metric n={stats!.avgBmi.toFixed(1)} label="Average BMI" />
            <Metric n={`${stats!.high}`} label="High-risk patients" tint={stats!.high > 0 ? "primary" : undefined} />
          </section>

          {/* trend sparkline */}
          <section className="surface-raised mb-12 grid gap-6 px-8 py-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="eyebrow mb-2">Risk trend · last {Math.min(rows.length, 10)} scans</div>
              <div className="text-sm text-ink2">
                {rows.length >= 2
                  ? `Trending ${rows[0].risk_score > rows[Math.min(rows.length, 10) - 1].risk_score ? "upward" : "downward"} from oldest to most recent`
                  : "Run more diagnoses to surface a trend."}
              </div>
            </div>
            <Sparkline values={[...rows.slice(0, 10)].reverse().map((r) => r.risk_score)} width={260} height={56} />
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
                    <div key={String(label)} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                      <span className="flex items-center gap-2 text-sm text-ink2">
                        <span className="h-2 w-2 rounded-full" style={{ background: `var(--${c as string})` }} />
                        {label}
                      </span>
                      <span className="font-mono text-xs">{String(count)} · {Math.round((Number(count) / stats!.total) * 100)}%</span>
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
                              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                            })} · BMI {Number(r.bmi).toFixed(1)} · SYS {r.ap_hi}
                          </div>
                        </div>
                        <div className="display-numeral text-3xl" style={{ color: `var(--${c})` }}>
                          {r.risk_score}<span className="text-xs align-top">%</span>
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

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Metric({ n, label, tint }: { n: string; label: string; tint?: string }) {
  return (
    <div className="bg-card px-6 py-7">
      <div className="display-numeral text-4xl" style={tint ? { color: `var(--${tint})` } : undefined}>{n}</div>
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
              key={i} cx="80" cy="80" r={r}
              fill="none" stroke={s.color} strokeWidth="14"
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
      <div className="display-numeral mb-3 text-7xl text-ink4">—</div>
      <h2 className="mb-3">No data <em>yet</em></h2>
      <p className="mb-8 max-w-md text-ink2">
        Run your first patient diagnostic to populate the dashboard with risk scores,
        tier distribution, and recent activity.
      </p>
      <Button asChild size="lg">
        <Link to="/diagnose">Run first diagnosis →</Link>
      </Button>
    </div>
  );
}
