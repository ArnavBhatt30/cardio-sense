import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, FileDown, ArrowUpDown, GitCompare, X, ChevronDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import JSZip from "jszip";
import { buildReport, downloadPdf, type ReportRecord } from "@/lib/pdf-report";
import { SkeletonRow } from "@/components/ui/skeleton-row";
import { EcgEmpty } from "@/components/site/EcgEmpty";
import { useSettings, formatHeight, formatWeight } from "@/lib/settings";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "Patient history — CardioSense" },
      { name: "description", content: "Your saved cardiovascular risk diagnoses." },
    ],
  }),
});

type Tier = "low" | "mid" | "high";
type Record = ReportRecord & { risk_tier: Tier };
type SortKey = "created_at" | "risk_score" | "patient_name" | "bmi";

function HistoryPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Record[] | null>(null);
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<Set<Tier>>(new Set());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { navigate({ to: "/auth" }); return; }
      if (!active) return;
      setAuthed(true);
      const { data: recs, error } = await supabase
        .from("patient_records")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) { toast.error(error.message); setRows([]); }
      else setRows(recs as Record[]);
    });
    return () => { active = false; };
  }, [navigate]);

  const onDelete = async (id: string) => {
    const prev = rows;
    setRows((r) => r?.filter((x) => x.id !== id) ?? null);
    setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
    const { error } = await supabase.from("patient_records").delete().eq("id", id);
    if (error) { toast.error("Failed to delete: " + error.message); setRows(prev); }
    else toast.success("Record deleted");
  };

  const onBulkDelete = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const prev = rows;
    setRows((r) => r?.filter((x) => !selected.has(x.id)) ?? null);
    setSelected(new Set());
    const { error } = await supabase.from("patient_records").delete().in("id", ids);
    if (error) { toast.error("Bulk delete failed: " + error.message); setRows(prev); }
    else toast.success(`${ids.length} record${ids.length === 1 ? "" : "s"} deleted`);
  };

  const onBulkExport = async () => {
    if (selected.size === 0) return;
    const targets = (rows ?? []).filter((r) => selected.has(r.id));
    if (targets.length === 1) { downloadPdf(targets[0]); return; }
    const zip = new JSZip();
    targets.forEach((r) => {
      const pdf = buildReport(r);
      const name = `cardiosense-${r.patient_name.replace(/\s+/g, "-").toLowerCase()}-${r.id.slice(0, 6)}.pdf`;
      zip.file(name, pdf.output("arraybuffer"));
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cardiosense-reports-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${targets.length} reports exported`);
  };

  const filtered = useMemo(() => {
    let out = rows ?? [];
    if (query.trim()) out = out.filter((r) => r.patient_name.toLowerCase().includes(query.toLowerCase()));
    if (tierFilter.size > 0) out = out.filter((r) => tierFilter.has(r.risk_tier));
    if (dateFrom) out = out.filter((r) => new Date(r.created_at) >= new Date(dateFrom));
    if (dateTo) out = out.filter((r) => new Date(r.created_at) <= new Date(dateTo + "T23:59:59"));
    out = [...out].sort((a, b) => {
      let av: number | string, bv: number | string;
      if (sortKey === "created_at") { av = new Date(a.created_at).getTime(); bv = new Date(b.created_at).getTime(); }
      else if (sortKey === "patient_name") { av = a.patient_name.toLowerCase(); bv = b.patient_name.toLowerCase(); }
      else { av = Number(a[sortKey]); bv = Number(b[sortKey]); }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [rows, query, tierFilter, dateFrom, dateTo, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "patient_name" ? "asc" : "desc"); }
  };

  const toggleTier = (t: Tier) =>
    setTierFilter((s) => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n; });

  const toggleSel = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAllSel = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };

  if (!authed) return null;
  const compareList = (rows ?? []).filter((r) => selected.has(r.id));

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 grid items-end gap-6 md:grid-cols-12">
        <div className="md:col-span-7">
          <div className="eyebrow eyebrow-dot mb-3">Records</div>
          <h1>Patient <em>history</em></h1>
        </div>
        <div className="md:col-span-5 md:text-right">
          <p className="text-sm text-ink2">
            {rows === null ? "Loading…"
              : rows.length === 0 ? "No diagnoses yet."
              : `${filtered.length} of ${rows.length} record${rows.length === 1 ? "" : "s"} shown`}
          </p>
        </div>
      </div>

      {rows === null && (
        <div className="surface-raised overflow-hidden">
          <table className="w-full text-sm">
            <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
          </table>
        </div>
      )}

      {rows && rows.length === 0 && (
        <div className="surface-raised flex flex-col items-center px-8 py-16 text-center">
          <EcgEmpty className="mb-6 h-20 w-72 text-primary/60" />
          <h3 className="mb-2">No diagnoses <em>yet</em></h3>
          <p className="mb-6 text-ink2">Run your first diagnosis to populate this log.</p>
          <Button asChild><Link to="/diagnose">Run a diagnosis →</Link></Button>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          {/* filter bar */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by patient name…"
              className="w-full max-w-xs rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-ink3 focus-visible:border-primary focus-visible:outline-none"
            />
            <div className="flex items-center gap-1.5">
              {(["low", "mid", "high"] as Tier[]).map((t) => {
                const c = t === "high" ? "primary" : t === "mid" ? "amber" : "sage";
                const active = tierFilter.has(t);
                const label = t === "high" ? "High" : t === "mid" ? "Moderate" : "Low";
                return (
                  <button
                    key={t} onClick={() => toggleTier(t)}
                    className="rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-all"
                    style={{
                      borderColor: active ? `var(--${c})` : "var(--border)",
                      background: active ? `color-mix(in oklab, var(--${c}) 14%, transparent)` : "transparent",
                      color: active ? `var(--${c})` : "var(--ink3)",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-ink2 focus-visible:border-primary focus-visible:outline-none" />
            <span className="text-ink3">→</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-ink2 focus-visible:border-primary focus-visible:outline-none" />
            {(query || tierFilter.size > 0 || dateFrom || dateTo) && (
              <button
                onClick={() => { setQuery(""); setTierFilter(new Set()); setDateFrom(""); setDateTo(""); }}
                className="font-mono text-[10px] uppercase tracking-widest text-ink3 hover:text-primary"
              >
                Clear
              </button>
            )}
          </div>

          {/* bulk action bar */}
          {selected.size > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 animate-[fade-in_0.2s_ease-out]">
              <span className="font-mono text-xs text-ink2">
                <span className="text-primary">{selected.size}</span> selected
              </span>
              <div className="flex items-center gap-2">
                {selected.size >= 2 && (
                  <Button size="sm" variant="outline" onClick={() => setCompareOpen(true)}>
                    <GitCompare className="h-3.5 w-3.5" /> Compare
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={onBulkExport}>
                  <FileDown className="h-3.5 w-3.5" /> Export {selected.size === 1 ? "PDF" : "ZIP"}
                </Button>
                <Button size="sm" variant="outline" onClick={onBulkDelete}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
                <button onClick={() => setSelected(new Set())} className="text-ink3 hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="surface-raised overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bone2/50">
                <tr className="text-left">
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onChange={toggleAllSel}
                      className="h-3.5 w-3.5 cursor-pointer accent-primary"
                    />
                  </th>
                  <SortableTh label="Patient" k="patient_name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-widest text-ink3">Age</th>
                  <SortableTh label="BMI" k="bmi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-widest text-ink3">BP</th>
                  <SortableTh label="Risk" k="risk_score" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <th className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-widest text-ink3">Tier</th>
                  <SortableTh label="Logged" k="created_at" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const c = r.risk_tier === "high" ? "primary" : r.risk_tier === "mid" ? "amber" : "sage";
                  const tierLabel = r.risk_tier === "high" ? "High" : r.risk_tier === "mid" ? "Mod" : "Low";
                  const isSel = selected.has(r.id);
                  return (
                    <tr key={r.id}
                      className="border-t border-border transition-colors hover:bg-bone2/30"
                      style={isSel ? { background: "color-mix(in oklab, var(--primary) 5%, transparent)" } : undefined}
                    >
                      <td className="px-4 py-4">
                        <input type="checkbox" checked={isSel} onChange={() => toggleSel(r.id)}
                          aria-label={`Select ${r.patient_name}`}
                          className="h-3.5 w-3.5 cursor-pointer accent-primary" />
                      </td>
                      <td className="px-5 py-4 font-medium">{r.patient_name}</td>
                      <td className="px-5 py-4 font-mono text-xs text-ink2">{r.age}</td>
                      <td className="px-5 py-4 font-mono text-xs text-ink2">{Number(r.bmi).toFixed(1)}</td>
                      <td className="px-5 py-4 font-mono text-xs text-ink2">{r.ap_hi}/{r.ap_lo}</td>
                      <td className="px-5 py-4">
                        <span className="display-numeral text-2xl" style={{ color: `var(--${c})` }}>
                          {r.risk_score}<span className="ml-0.5 text-[10px] align-top">%</span>
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest"
                          style={{
                            borderColor: `color-mix(in oklab, var(--${c}) 30%, transparent)`,
                            background: `color-mix(in oklab, var(--${c}) 8%, transparent)`,
                            color: `var(--${c})`,
                          }}>
                          {tierLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-[10px] text-ink3">
                        {new Date(r.created_at).toLocaleString("en-GB", {
                          day: "2-digit", month: "short", year: "2-digit",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => downloadPdf(r)}
                            className="rounded p-1.5 text-ink3 transition-all hover:text-primary hover:bg-primary/5"
                            aria-label="Download PDF" title="Download PDF report">
                            <FileDown className="h-4 w-4" />
                          </button>
                          <button onClick={() => onDelete(r.id)}
                            className="rounded p-1.5 text-ink3 transition-all hover:text-primary hover:bg-primary/5"
                            aria-label="Delete record">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-ink3">No records match those filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {compareOpen && compareList.length >= 2 && (
        <CompareModal records={compareList} onClose={() => setCompareOpen(false)} />
      )}
    </div>
  );
}

function SortableTh({ label, k, sortKey, sortDir, onSort }: {
  label: string; k: SortKey; sortKey: SortKey; sortDir: "asc" | "desc"; onSort: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  return (
    <th className="px-5 py-3.5">
      <button onClick={() => onSort(k)}
        className={`group inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${active ? "text-foreground" : "text-ink3 hover:text-ink2"}`}>
        {label}
        <ArrowUpDown className={`h-3 w-3 transition-transform ${active && sortDir === "asc" ? "rotate-180" : ""} ${active ? "text-primary" : "opacity-40"}`} />
      </button>
    </th>
  );
}

function CompareModal({ records, onClose }: { records: Record[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 px-4 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-4xl overflow-auto rounded-xl border border-border bg-card shadow-2xl animate-[scale-in_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border bg-bone2/50 px-6 py-4">
          <div>
            <div className="eyebrow">Comparison</div>
            <h3 className="mt-1">Comparing <em>{records.length}</em> patients</h3>
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-ink3 hover:bg-bone2 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-x-auto p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink3">Metric</th>
                {records.map((r) => (
                  <th key={r.id} className="py-3 text-left font-medium">{r.patient_name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CmpRow label="Risk score" records={records} fmt={(r) => `${r.risk_score}%`}
                tint={(r) => r.risk_tier === "high" ? "primary" : r.risk_tier === "mid" ? "amber" : "sage"} large />
              <CmpRow label="Tier" records={records} fmt={(r) => r.risk_tier === "high" ? "High" : r.risk_tier === "mid" ? "Moderate" : "Low"} />
              <CmpRow label="Age" records={records} fmt={(r) => `${r.age} yr`} />
              <CmpRow label="BMI" records={records} fmt={(r) => Number(r.bmi).toFixed(1)} />
              <CmpRow label="Blood pressure" records={records} fmt={(r) => `${r.ap_hi}/${r.ap_lo}`} />
              <CmpRow label="Logged" records={records} fmt={(r) => new Date(r.created_at).toLocaleDateString("en-GB")} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CmpRow({ label, records, fmt, tint, large }: {
  label: string; records: Record[]; fmt: (r: Record) => string; tint?: (r: Record) => string; large?: boolean;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 font-mono text-[10px] uppercase tracking-widest text-ink3">{label}</td>
      {records.map((r) => (
        <td key={r.id} className={large ? "py-3" : "py-3 text-sm"}>
          {large ? (
            <span className="display-numeral text-3xl" style={tint ? { color: `var(--${tint(r)})` } : undefined}>{fmt(r)}</span>
          ) : (
            <span style={tint ? { color: `var(--${tint(r)})` } : undefined}>{fmt(r)}</span>
          )}
        </td>
      ))}
    </tr>
  );
}
