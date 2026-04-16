import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { predictRisk } from "@/server/predict";
import { toast } from "sonner";
import { DiagnoseForm, type FormState } from "@/components/diagnose/DiagnoseForm";
import { RiskReadout } from "@/components/diagnose/RiskReadout";
import {
  buildNotes, buildVitals, calcBmi, tierFromRisk,
  type Payload, type Result,
} from "@/lib/risk-utils";

export const Route = createFileRoute("/diagnose")({
  component: DiagnosePage,
  head: () => ({
    meta: [
      { title: "Diagnose — CardioSense" },
      { name: "description", content: "Run a real-time cardiovascular risk assessment." },
    ],
  }),
});

function DiagnosePage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { navigate({ to: "/auth" }); return; }
      setAuthed(true);
      const { data: recs } = await supabase
        .from("patient_records")
        .select("patient_name")
        .order("created_at", { ascending: false })
        .limit(50);
      if (recs) setSuggestions(Array.from(new Set(recs.map((r) => r.patient_name))));
    });
  }, [navigate]);

  const onSubmit = async (form: FormState) => {
    if (Object.entries(form).some(([k, v]) => k !== "patient_name" && v === "")) {
      toast.error("Please complete every clinical field.");
      return;
    }
    if (!form.patient_name.trim()) {
      toast.error("Please enter a patient identifier.");
      return;
    }

    const payload: Payload = {
      age: parseFloat(form.age),
      gender: parseInt(form.gender, 10),
      height: parseFloat(form.height),
      weight: parseFloat(form.weight),
      ap_hi: parseInt(form.ap_hi, 10),
      ap_lo: parseInt(form.ap_lo, 10),
      cholesterol: parseInt(form.cholesterol, 10),
      gluc: parseInt(form.gluc, 10),
      smoke: parseInt(form.smoke, 10),
      alco: parseInt(form.alco, 10),
      active: parseInt(form.active, 10),
    };

    setLoading(true);
    setResult(null);
    try {
      const res = await predictRisk({ data: payload });
      if (!res.ok) { toast.error(res.error); return; }
      const risk = Math.round(res.probability * 100);
      const tier = tierFromRisk(risk);
      const bmi = calcBmi(payload.weight, payload.height);
      const computed: Result = {
        risk, tier, confidence: res.confidence, bmi,
        vitals: buildVitals(payload, bmi),
        notes: buildNotes(payload, bmi),
      };
      setResult(computed);

      const { data: sess } = await supabase.auth.getSession();
      const userId = sess.session?.user.id;
      if (userId) {
        const { error } = await supabase.from("patient_records").insert({
          user_id: userId,
          patient_name: form.patient_name.trim(),
          ...payload,
          bmi,
          risk_score: risk,
          risk_tier: tier,
          confidence: res.confidence,
        });
        if (error) toast.error("Saved analysis but failed to log: " + error.message);
        else toast.success(`Analysis complete — ${risk}% risk · saved`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  if (!authed) return null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <div className="eyebrow eyebrow-dot mb-3">New analysis</div>
          <h1>Patient <em>diagnostic</em></h1>
        </div>
        <p className="hidden max-w-xs text-right text-sm text-ink2 md:block">
          11 clinical inputs · real-time XGBoost inference · saved to your private history.
        </p>
      </div>

      <DiagnoseForm onSubmit={onSubmit} loading={loading} suggestions={suggestions} />
      {result && <RiskReadout r={result} />}
    </div>
  );
}
