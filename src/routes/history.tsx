import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "Patient History — CardioSense" },
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
  created_at: string;
};

function HistoryPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Record[] | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      if (!active) return;
      setAuthed(true);
      const { data: recs, error } = await supabase
        .from("patient_records")
        .select("id,patient_name,age,risk_score,risk_tier,bmi,ap_hi,created_at")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(error.message);
        setRows([]);
      } else {
        setRows(recs as Record[]);
      }
    });
    return () => { active = false; };
  }, [navigate]);

  const onDelete = async (id: string) => {
    const prev = rows;
    setRows((r) => r?.filter((x) => x.id !== id) ?? null);
    const { error } = await supabase.from("patient_records").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
      setRows(prev);
    }
  };

  if (!authed) return null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="eyebrow mb-3">Records</div>
      <h1 className="mb-2">Patient <em>history</em></h1>
      <p className="mb-10 text-ink2">
        {rows === null ? "Loading…" : rows.length === 0
          ? "No diagnoses yet."
          : `${rows.length} record${rows.length === 1 ? "" : "s"}.`}
      </p>

      {rows && rows.length === 0 && (
        <div className="surface p-8 text-center">
          <p className="mb-4 text-ink2">Run your first diagnosis to populate this log.</p>
          <Button asChild><Link to="/diagnose">Run a diagnosis →</Link></Button>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream2/50">
              <tr className="text-left">
                {["Patient", "Age", "BMI", "Sys BP", "Risk", "Date", ""].map(h => (
                  <th key={h} className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const c = r.risk_tier === "high" ? "text-primary" : r.risk_tier === "mid" ? "text-amber" : "text-green";
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{r.patient_name}</td>
                    <td className="px-4 py-3 text-ink2">{r.age}</td>
                    <td className="px-4 py-3 text-ink2">{Number(r.bmi).toFixed(1)}</td>
                    <td className="px-4 py-3 text-ink2">{r.ap_hi}</td>
                    <td className={`px-4 py-3 font-medium ${c}`}>{r.risk_score}%</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink3">
                      {new Date(r.created_at).toLocaleString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => onDelete(r.id)} className="text-xs text-ink3 hover:text-primary">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
