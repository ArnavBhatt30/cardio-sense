import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { predictRisk } from "@/server/predict";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/diagnose")({
  component: DiagnosePage,
  head: () => ({
    meta: [
      { title: "Diagnose — CardioSense" },
      { name: "description", content: "Run a real-time cardiovascular risk assessment." },
    ],
  }),
});

type FormState = {
  patient_name: string;
  age: string; gender: string;
  height: string; weight: string;
  ap_hi: string; ap_lo: string;
  cholesterol: string; gluc: string;
  smoke: string; alco: string; active: string;
};

const empty: FormState = {
  patient_name: "", age: "", gender: "", height: "", weight: "",
  ap_hi: "", ap_lo: "", cholesterol: "", gluc: "", smoke: "", alco: "", active: "",
};

type Result = {
  risk: number;
  tier: "low" | "mid" | "high";
  confidence: number | null;
  bmi: number;
  vitals: Array<{ name: string; value: string; status: "ok" | "warn" | "bad"; pct: number }>;
  notes: Array<{ kind: "ok" | "warn" | "danger"; text: string }>;
};

function DiagnosePage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
      } else {
        setAuthed(true);
      }
    });
  }, [navigate]);

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.entries(form).some(([k, v]) => k !== "patient_name" && v === "")) {
      toast.error("Please fill all clinical fields");
      return;
    }
    if (!form.patient_name.trim()) {
      toast.error("Please enter a patient name or identifier");
      return;
    }

    const payload = {
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
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const risk = Math.round(res.probability * 100);
      const tier: Result["tier"] = risk > 65 ? "high" : risk > 35 ? "mid" : "low";
      const bmi = payload.weight / Math.pow(payload.height / 100, 2);

      const bpS = payload.ap_hi > 140 ? "bad" : payload.ap_hi > 120 ? "warn" : "ok";
      const bpDS = payload.ap_lo > 90 ? "bad" : payload.ap_lo > 80 ? "warn" : "ok";
      const bmiS = bmi > 30 ? "bad" : bmi > 25 ? "warn" : "ok";
      const cholS = payload.cholesterol === 3 ? "bad" : payload.cholesterol === 2 ? "warn" : "ok";

      const vitals: Result["vitals"] = [
        { name: "Systolic BP",  value: `${payload.ap_hi} mmHg`, status: bpS,  pct: Math.min((payload.ap_hi/200)*100,100) },
        { name: "Diastolic BP", value: `${payload.ap_lo} mmHg`, status: bpDS, pct: Math.min((payload.ap_lo/140)*100,100) },
        { name: "BMI",          value: bmi.toFixed(1),           status: bmiS, pct: Math.min((bmi/40)*100,100) },
        { name: "Cholesterol",  value: ["—","Normal","↑ High","↑↑ Very High"][payload.cholesterol], status: cholS, pct: [0,30,65,100][payload.cholesterol] },
      ];

      const notes: Result["notes"] = [];
      if (payload.ap_hi > 140) notes.push({ kind: "danger", text: "Hypertension — systolic BP > 140 mmHg" });
      if (payload.ap_lo > 90)  notes.push({ kind: "warn",   text: "Elevated diastolic BP > 90 mmHg" });
      if (payload.cholesterol === 3) notes.push({ kind: "danger", text: "Cholesterol well above normal" });
      if (payload.gluc >= 2) notes.push({ kind: "warn", text: "Elevated blood glucose detected" });
      if (payload.smoke === 1) notes.push({ kind: "warn", text: "Active smoker — significant risk factor" });
      if (bmi > 30) notes.push({ kind: "warn", text: `BMI ${bmi.toFixed(1)} — classified as obese` });
      if (payload.active === 0) notes.push({ kind: "warn", text: "Sedentary lifestyle increases risk" });
      if (notes.length === 0) notes.push({ kind: "ok", text: "No critical risk indicators detected" });

      const computed: Result = { risk, tier, confidence: res.confidence, bmi, vitals, notes };
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
        if (error) {
          toast.error("Saved analysis but failed to log: " + error.message);
        } else {
          toast.success(`Analysis complete — ${risk}% risk · saved to history`);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  if (!authed) return null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="eyebrow mb-3">New analysis</div>
      <h1 className="mb-2">Patient <em>diagnostic</em></h1>
      <p className="mb-10 text-ink2">All 11 clinical inputs are required. Results are saved to your private history.</p>

      <form onSubmit={onSubmit} className="surface p-8">
        <div className="mb-8">
          <Label htmlFor="patient_name">Patient name / identifier</Label>
          <Input
            id="patient_name" className="mt-2"
            value={form.patient_name}
            onChange={(e) => set("patient_name", e.target.value)}
            placeholder="e.g. John Doe or MRN-1234"
            required
          />
        </div>

        <SectionTitle>Demographics</SectionTitle>
        <div className="grid gap-5 md:grid-cols-2">
          <NumField label="Age (years)" id="age" value={form.age} onChange={(v)=>set("age",v)} min={1} max={120} />
          <SelectField label="Gender" value={form.gender} onChange={(v)=>set("gender",v)} options={[
            { v: "1", l: "Female" }, { v: "2", l: "Male" },
          ]} />
          <NumField label="Height (cm)" id="height" value={form.height} onChange={(v)=>set("height",v)} min={100} max={220} />
          <NumField label="Weight (kg)" id="weight" value={form.weight} onChange={(v)=>set("weight",v)} min={30} max={250} />
        </div>

        <SectionTitle className="mt-10">Vitals</SectionTitle>
        <div className="grid gap-5 md:grid-cols-2">
          <NumField label="Systolic BP (mmHg)"  id="ap_hi" value={form.ap_hi} onChange={(v)=>set("ap_hi",v)} min={50} max={260} />
          <NumField label="Diastolic BP (mmHg)" id="ap_lo" value={form.ap_lo} onChange={(v)=>set("ap_lo",v)} min={30} max={200} />
          <SelectField label="Cholesterol" value={form.cholesterol} onChange={(v)=>set("cholesterol",v)} options={[
            { v: "1", l: "Normal" }, { v: "2", l: "Above normal" }, { v: "3", l: "Well above normal" },
          ]} />
          <SelectField label="Glucose" value={form.gluc} onChange={(v)=>set("gluc",v)} options={[
            { v: "1", l: "Normal" }, { v: "2", l: "Above normal" }, { v: "3", l: "Well above normal" },
          ]} />
        </div>

        <SectionTitle className="mt-10">Lifestyle</SectionTitle>
        <div className="grid gap-5 md:grid-cols-3">
          <SelectField label="Smoker" value={form.smoke} onChange={(v)=>set("smoke",v)} options={YN} />
          <SelectField label="Alcohol" value={form.alco} onChange={(v)=>set("alco",v)} options={YN} />
          <SelectField label="Physically active" value={form.active} onChange={(v)=>set("active",v)} options={YN} />
        </div>

        <div className="mt-10 flex items-center justify-between">
          <p className="font-mono text-xs text-ink3">⚕ For screening only — not a clinical diagnosis.</p>
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Analysing…" : "Run AI diagnosis"}
          </Button>
        </div>
      </form>

      {result && <ResultCard r={result} />}
    </div>
  );
}

const YN = [{ v: "1", l: "Yes" }, { v: "0", l: "No" }];

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`eyebrow mb-4 ${className}`}>{children}</div>;
}

function NumField({ label, id, value, onChange, min, max }:{
  label: string; id: string; value: string; onChange: (v:string)=>void; min?: number; max?: number;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" inputMode="decimal" min={min} max={max}
        className="mt-2" value={value} onChange={(e)=>onChange(e.target.value)} required />
    </div>
  );
}

function SelectField({ label, value, onChange, options }:{
  label: string; value: string; onChange: (v:string)=>void; options: {v:string;l:string}[];
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-2"><SelectValue placeholder="Select…" /></SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function ResultCard({ r }: { r: Result }) {
  const tierColor =
    r.tier === "high" ? "text-primary" : r.tier === "mid" ? "text-amber" : "text-green";
  const tierLabel = r.tier === "high" ? "HIGH RISK" : r.tier === "mid" ? "MODERATE RISK" : "LOW RISK";

  return (
    <div className="surface mt-10 overflow-hidden">
      <div className="flex items-start justify-between border-b border-border bg-cream2/50 p-8">
        <div>
          <div className={`font-serif text-6xl ${tierColor}`}>{r.risk}%</div>
          <div className={`mt-2 font-mono text-xs tracking-widest ${tierColor}`}>{tierLabel}</div>
        </div>
        <div className="text-right text-xs text-ink2">
          <div>Cardiovascular Risk</div>
          <div>BMI {r.bmi.toFixed(1)}</div>
          {r.confidence !== null && <div>Confidence: {Math.round(r.confidence * 100)}%</div>}
        </div>
      </div>
      <div className="grid gap-10 p-8 md:grid-cols-2">
        <div>
          <div className="eyebrow mb-4">Vitals overview</div>
          <div className="space-y-4">
            {r.vitals.map(v => (
              <div key={v.name}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="text-ink2">{v.name}</span>
                  <span className={
                    v.status === "bad" ? "font-medium text-primary" :
                    v.status === "warn" ? "font-medium text-amber" : "font-medium text-green"
                  }>{v.value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-cream2">
                  <div className="h-full rounded-full" style={{
                    width: `${v.pct}%`,
                    background: v.status === "bad" ? "var(--primary)" : v.status === "warn" ? "var(--amber)" : "var(--green)",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="eyebrow mb-4">Clinical notes</div>
          <ul className="space-y-2">
            {r.notes.map((n, i) => (
              <li key={i} className={
                "rounded-md border px-3 py-2 text-sm " +
                (n.kind === "danger" ? "border-primary/30 bg-primary/5 text-primary" :
                 n.kind === "warn"   ? "border-amber/30 bg-amber/5 text-amber" :
                                       "border-green/30 bg-green/5 text-green")
              }>{n.text}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
