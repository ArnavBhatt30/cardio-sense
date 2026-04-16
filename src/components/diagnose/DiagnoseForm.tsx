import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { calcBmi } from "@/lib/risk-utils";

export type FormState = {
  patient_name: string;
  age: string; gender: string;
  height: string; weight: string;
  ap_hi: string; ap_lo: string;
  cholesterol: string; gluc: string;
  smoke: string; alco: string; active: string;
};

export const emptyForm: FormState = {
  patient_name: "", age: "", gender: "", height: "", weight: "",
  ap_hi: "", ap_lo: "", cholesterol: "", gluc: "", smoke: "", alco: "", active: "",
};

const YN = [{ v: "1", l: "Yes" }, { v: "0", l: "No" }];

export function DiagnoseForm({
  onSubmit, loading,
}: {
  onSubmit: (f: FormState) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const set = <K extends keyof FormState>(k: K, v: string) => setForm((s) => ({ ...s, [k]: v }));
  const liveBmi = form.height && form.weight
    ? calcBmi(parseFloat(form.weight), parseFloat(form.height))
    : null;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="surface-raised overflow-hidden"
    >
      <div className="border-b border-border bg-bone2/40 px-8 py-6">
        <Label htmlFor="patient_name" className="eyebrow">Patient identifier</Label>
        <Input
          id="patient_name"
          className="mt-3 border-0 border-b border-border bg-transparent px-0 font-serif text-2xl shadow-none focus-visible:border-primary focus-visible:ring-0"
          value={form.patient_name}
          onChange={(e) => set("patient_name", e.target.value)}
          placeholder="John Doe · MRN-1234"
          required
        />
      </div>

      <FieldGroup index="01" title="Demographics" caption="Patient baseline">
        <NumField label="Age (years)" id="age" value={form.age} onChange={(v) => set("age", v)} min={1} max={120} />
        <SelectField label="Sex" value={form.gender} onChange={(v) => set("gender", v)} options={[{ v: "1", l: "Female" }, { v: "2", l: "Male" }]} />
        <NumField label="Height (cm)" id="height" value={form.height} onChange={(v) => set("height", v)} min={100} max={220} />
        <NumField label="Weight (kg)" id="weight" value={form.weight} onChange={(v) => set("weight", v)} min={30} max={250} />
        {liveBmi && (
          <div className="md:col-span-2">
            <div className="rounded-md border border-border bg-bone2/50 px-4 py-2 font-mono text-xs text-ink2">
              Live BMI · <span className="text-foreground">{liveBmi.toFixed(1)}</span>
            </div>
          </div>
        )}
      </FieldGroup>

      <FieldGroup index="02" title="Vitals" caption="Blood pressure & labs">
        <NumField label="Systolic BP (mmHg)" id="ap_hi" value={form.ap_hi} onChange={(v) => set("ap_hi", v)} min={50} max={260} />
        <NumField label="Diastolic BP (mmHg)" id="ap_lo" value={form.ap_lo} onChange={(v) => set("ap_lo", v)} min={30} max={200} />
        <SelectField label="Cholesterol" value={form.cholesterol} onChange={(v) => set("cholesterol", v)} options={[
          { v: "1", l: "Normal" }, { v: "2", l: "Above normal" }, { v: "3", l: "Well above normal" },
        ]} />
        <SelectField label="Glucose" value={form.gluc} onChange={(v) => set("gluc", v)} options={[
          { v: "1", l: "Normal" }, { v: "2", l: "Above normal" }, { v: "3", l: "Well above normal" },
        ]} />
      </FieldGroup>

      <FieldGroup index="03" title="Lifestyle" caption="Modifiable risk factors">
        <SelectField label="Smoker" value={form.smoke} onChange={(v) => set("smoke", v)} options={YN} />
        <SelectField label="Alcohol" value={form.alco} onChange={(v) => set("alco", v)} options={YN} />
        <SelectField label="Physically active" value={form.active} onChange={(v) => set("active", v)} options={YN} />
      </FieldGroup>

      <div className="flex flex-col items-start justify-between gap-4 border-t border-border bg-bone2/30 px-8 py-6 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink3">⚕ Screening only — not a clinical diagnosis</p>
          {restored && (
            <button type="button" onClick={clearDraft}
              className="text-left font-mono text-[10px] uppercase tracking-widest text-primary hover:underline animate-[fade-in_0.3s_ease-out]">
              Draft restored · clear
            </button>
          )}
        </div>
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Analysing…" : "Run AI diagnosis →"}
        </Button>
      </div>
    </form>
  );
}

function FieldGroup({ index, title, caption, children }: {
  index: string; title: string; caption: string; children: React.ReactNode;
}) {
  return (
    <div className="grid gap-8 border-t border-border px-8 py-8 md:grid-cols-[180px_1fr]">
      <div>
        <div className="font-mono text-[10px] tracking-widest text-ink4">{index}</div>
        <h3 className="mt-1 font-serif text-xl">{title}</h3>
        <div className="mt-1 text-xs text-ink3">{caption}</div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">{children}</div>
    </div>
  );
}

function NumField({ label, id, value, onChange, min, max }: {
  label: string; id: string; value: string; onChange: (v: string) => void; min?: number; max?: number;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs text-ink2">{label}</Label>
      <Input id={id} type="number" inputMode="decimal" min={min} max={max}
        className="mt-2" value={value} onChange={(e) => onChange(e.target.value)} required />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[];
}) {
  return (
    <div>
      <Label className="text-xs text-ink2">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-2"><SelectValue placeholder="Select…" /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
