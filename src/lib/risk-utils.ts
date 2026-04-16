export type RiskTier = "low" | "mid" | "high";
export type VitalStatus = "ok" | "warn" | "bad";

export type Payload = {
  age: number;
  gender: number;
  height: number;
  weight: number;
  ap_hi: number;
  ap_lo: number;
  cholesterol: number;
  gluc: number;
  smoke: number;
  alco: number;
  active: number;
};

export type Vital = { name: string; value: string; status: VitalStatus; pct: number };
export type Note = { kind: "ok" | "warn" | "danger"; text: string };

export type Result = {
  risk: number;
  tier: RiskTier;
  confidence: number | null;
  bmi: number;
  vitals: Vital[];
  notes: Note[];
};

export function tierFromRisk(risk: number): RiskTier {
  return risk > 65 ? "high" : risk > 35 ? "mid" : "low";
}

export function tierLabel(t: RiskTier) {
  return t === "high" ? "High risk" : t === "mid" ? "Moderate risk" : "Low risk";
}

export function tierToken(t: RiskTier) {
  return t === "high" ? "primary" : t === "mid" ? "amber" : "sage";
}

export function buildVitals(p: Payload, bmi: number): Vital[] {
  const bpS: VitalStatus = p.ap_hi > 140 ? "bad" : p.ap_hi > 120 ? "warn" : "ok";
  const bpDS: VitalStatus = p.ap_lo > 90 ? "bad" : p.ap_lo > 80 ? "warn" : "ok";
  const bmiS: VitalStatus = bmi > 30 ? "bad" : bmi > 25 ? "warn" : "ok";
  const cholS: VitalStatus = p.cholesterol === 3 ? "bad" : p.cholesterol === 2 ? "warn" : "ok";
  return [
    { name: "Systolic BP", value: `${p.ap_hi} mmHg`, status: bpS, pct: Math.min((p.ap_hi / 200) * 100, 100) },
    { name: "Diastolic BP", value: `${p.ap_lo} mmHg`, status: bpDS, pct: Math.min((p.ap_lo / 140) * 100, 100) },
    { name: "Body mass index", value: bmi.toFixed(1), status: bmiS, pct: Math.min((bmi / 40) * 100, 100) },
    {
      name: "Cholesterol",
      value: ["—", "Normal", "Above normal", "Well above"][p.cholesterol],
      status: cholS,
      pct: [0, 30, 65, 100][p.cholesterol],
    },
  ];
}

export function buildNotes(p: Payload, bmi: number): Note[] {
  const notes: Note[] = [];
  if (p.ap_hi > 140) notes.push({ kind: "danger", text: "Hypertension — systolic BP above 140 mmHg." });
  if (p.ap_lo > 90) notes.push({ kind: "warn", text: "Elevated diastolic BP above 90 mmHg." });
  if (p.cholesterol === 3) notes.push({ kind: "danger", text: "Cholesterol well above normal range." });
  if (p.gluc >= 2) notes.push({ kind: "warn", text: "Elevated blood glucose detected." });
  if (p.smoke === 1) notes.push({ kind: "warn", text: "Active smoker — significant modifiable risk factor." });
  if (bmi > 30) notes.push({ kind: "warn", text: `BMI ${bmi.toFixed(1)} — clinical obesity range.` });
  if (p.active === 0) notes.push({ kind: "warn", text: "Sedentary lifestyle — increases CV risk." });
  if (notes.length === 0) notes.push({ kind: "ok", text: "No critical risk indicators detected." });
  return notes;
}

export function calcBmi(weightKg: number, heightCm: number) {
  return weightKg / Math.pow(heightCm / 100, 2);
}
