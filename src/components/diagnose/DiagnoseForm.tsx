import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { calcBmi } from "@/lib/risk-utils";
import { toast } from "sonner";
import { PRESETS } from "@/lib/presets";
import { Sparkles, ChevronDown } from "lucide-react";

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
const DRAFT_KEY = "cardiosense:diagnose-draft";

export function DiagnoseForm({
  onSubmit, loading, suggestions = [],
}: {
  onSubmit: (f: FormState) => void;
  loading: boolean;
  suggestions?: string[];
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [restored, setRestored] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FormState;
        if (Object.values(parsed).some((v) => v)) {
          setForm({ ...emptyForm, ...parsed });
          setRestored(true);
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (Object.values(form).every((v) => !v)) {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }
    const id = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* ignore */ }
    }, 250);
    return () => clearTimeout(id);
  }, [form]);

  const set = <K extends keyof FormState>(k: K, v: string) => setForm((s) => ({ ...s, [k]: v }));
  const liveBmi = form.height && form.weight
    ? calcBmi(parseFloat(form.weight), parseFloat(form.height))
    : null;

  const clearDraft = () => {
    setForm(emptyForm);
    localStorage.removeItem(DRAFT_KEY);
    setRestored(false);
    toast.success("Draft cleared");
  };

  const applyPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setForm({ patient_name: form.patient_name || `Sample · ${p.label}`, ...p.data });
    setPresetsOpen(false);
    toast.success(`Loaded ${p.label} preset`);
  };

  const filteredSuggestions = form.patient_name
    ? suggestions.filter(
        (n) => n.toLowerCase().includes(form.patient_name.toLowerCase()) && n !== form.patient_name,
      ).slice(0, 5)
    : [];

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="surface-raised overflow-hidden"
    >
      {/* Preset bar */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-bone2/30 px-8 py-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink3">Quick start</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setPresetsOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-ink2 transition-all hover:text-foreground hover:border-primary/40"
          >
            <Sparkles className="h-3 w-3" /> Sample patient
            <ChevronDown className={`h-3 w-3 transition-transform ${presetsOpen ? "rotate-180" : ""}`} />
          </button>
          {presetsOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-64 overflow-hidden rounded-md border border-border bg-card shadow-xl animate-[scale-in_0.15s_ease-out]">
              {PRESETS.map((p) => {
                const c = p.tier === "high" ? "primary" : p.tier === "mid" ? "amber" : "sage";
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id)}
                    className="flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-bone2/50"
                  >
                    <div>
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="font-mono text-[10px] text-ink3">{p.caption}</div>
                    </div>
                    <span className="h-2 w-2 rounded-full" style={{ background: `var(--${c})` }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="relative border-b border-border bg-bone2/40 px-8 py-6">
        <Label htmlFor="patient_name" className="eyebrow">Patient identifier</Label>
        <Input
          id="patient_name"
          autoComplete="off"
          className="mt-3 border-0 border-b border-border bg-transparent px-0 font-serif text-2xl shadow-none focus-visible:border-primary focus-visible:ring-0"
          value={form.patient_name}
          onChange={(e) => { set("patient_name", e.target.value); setShowSuggest(true); }}
          onFocus={() => setShowSuggest(true)}
          onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
          placeholder="John Doe · MRN-1234"
          required
        />
        {showSuggest && filteredSuggestions.length > 0 && (
          <div className="absolute left-8 right-8 top-full z-10 mt-1 overflow-hidden rounded-md border border-border bg-card shadow-xl animate-[fade-in_0.15s_ease-out]">
            <div className="border-b border-border bg-bone2/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ink3">
              Existing patients
            </div>
            {filteredSuggestions.map((n) => (
              <button
                key={n}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); set("patient_name", n); setShowSuggest(false); }}
                className="block w-full border-b border-border px-3 py-2 text-left text-sm transition-colors last:border-0 hover:bg-bone2/50"
              >
                {n}
              </button>
            ))}
          </div>
        )}
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
