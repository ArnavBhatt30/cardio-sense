import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "Patient history — CardioSense" },
      { name: "description", content: "Your saved cardiovascular risk diagnoses." },
    ],
  }),
});

type Record = {
  id: string;
  patient_name: string;
  age: number;
  risk_score: number;
  risk_tier: "low" | "mid" | "high";
  bmi: number;
  ap_hi: number;
  ap_lo: number;
  created_at: string;
};

function HistoryPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Record[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { navigate({ to: "/auth" }); return; }
      if (!active) return;
      setAuthed(true);
      const { data: recs, error } = await supabase
        .from("patient_records")
        .select("id,patient_name,age,risk_score,risk_tier,bmi,ap_hi,ap_lo,created_at")
        .order("created_at", { ascending: false });
      if (error) { toast.error(error.message); setRows([]); }
      else setRows(recs as Record[]);
    });
    return () => { active = false; };
  }, [navigate]);

  const onDelete = async (id: string) => {
    const prev = rows;
    setRows((r) => r?.filter((x) => x.id !== id) ?? null);
    const { error } = await supabase.from("patient_records").delete().eq("id", id);
    if (error) { toast.error("Failed to delete: " + error.message); setRows(prev); }
    else toast.success("Record deleted");
  };

  if (!authed) return null;

  const filtered = (rows ?? []).filter((r) =>
    !query.trim() || r.patient_name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 grid items-end gap-6 md:grid-cols-12">
        <div className="md:col-span-7">
          <div className="eyebrow eyebrow-dot mb-3">Records</div>
          <h1>Patient <em>history</em></h1>
        </div>
        <div className="md:col-span-5 md:text-right">
          <p className="text-sm text-ink2">
            {rows === null ? "Loading…"
              : rows.length === 0 ? "No diagnoses yet."
              : `${rows.length} record${rows.length === 1 ? "" : "s"} · sorted by most recent`}
          </p>
        </div>
      </div>

      {rows && rows.length === 0 && (
        <div className="surface-raised flex flex-col items-center px-8 py-16 text-center">
          <div className="display-numeral mb-2 text-6xl text-ink4">0</div>
          <p className="mb-6 text-ink2">Run your first diagnosis to populate this log.</p>
          <Button asChild><Link to="/diagnose">Run a diagnosis →</Link></Button>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by patient name…"
              className="w-full max-w-sm rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-ink3 focus-visible:border-primary focus-visible:outline-none"
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink3">
              {filtered.length} shown
            </span>
          </div>

          <div className="surface-raised overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bone2/50">
                <tr className="text-left">
                  {["Patient", "Age", "BMI", "BP", "Risk", "Tier", "Logged", ""].map((h) => (
                    <th key={h} className="px-5 py-3.5 font-mono text-[10px] uppercase tracking-widest text-ink3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const c = r.risk_tier === "high" ? "primary" : r.risk_tier === "mid" ? "amber" : "sage";
                  const tierLabel = r.risk_tier === "high" ? "High" : r.risk_tier === "mid" ? "Mod" : "Low";
                  return (
                    <tr key={r.id} className="border-t border-border transition-colors hover:bg-bone2/30">
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
                        <span
                          className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest"
                          style={{
                            borderColor: `color-mix(in oklab, var(--${c}) 30%, transparent)`,
                            background: `color-mix(in oklab, var(--${c}) 8%, transparent)`,
                            color: `var(--${c})`,
                          }}
                        >
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
                        <button
                          onClick={() => onDelete(r.id)}
                          className="text-ink3 transition-colors hover:text-primary"
                          aria-label="Delete record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
