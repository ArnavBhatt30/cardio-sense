import jsPDF from "jspdf";

export type ReportRecord = {
  id: string;
  patient_name: string;
  age: number;
  gender?: number;
  height?: number;
  weight?: number;
  bmi: number;
  ap_hi: number;
  ap_lo: number;
  cholesterol?: number;
  gluc?: number;
  smoke?: number;
  alco?: number;
  active?: number;
  risk_score: number;
  risk_tier: string;
  created_at: string;
};

const lvl = (n?: number) => (n === 3 ? "Well above normal" : n === 2 ? "Above normal" : n === 1 ? "Normal" : "—");
const yn = (n?: number) => (n === 1 ? "Yes" : n === 0 ? "No" : "—");

export function buildReport(r: ReportRecord): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const tier = r.risk_tier === "high" ? "High" : r.risk_tier === "mid" ? "Moderate" : "Low";
  const tierColor: [number, number, number] =
    r.risk_tier === "high" ? [165, 45, 45] : r.risk_tier === "mid" ? [200, 145, 60] : [95, 145, 110];

  // Header
  doc.setFillColor(115, 28, 28);
  doc.rect(0, 0, W, 70, "F");
  doc.setTextColor(255, 248, 240);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("CardioSense", 40, 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Cardiovascular Risk Assessment Report", 40, 52);
  doc.text(`Report ID · ${r.id.slice(0, 8).toUpperCase()}`, W - 40, 35, { align: "right" });
  doc.text(new Date(r.created_at).toLocaleString("en-GB"), W - 40, 52, { align: "right" });

  // Patient
  let y = 110;
  doc.setTextColor(110, 100, 95);
  doc.setFontSize(9);
  doc.text("PATIENT", 40, y);
  doc.setFontSize(20);
  doc.setTextColor(30, 25, 22);
  doc.setFont("helvetica", "bold");
  doc.text(r.patient_name, 40, y + 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 100, 95);
  doc.text(`Age ${r.age} · ${r.gender === 2 ? "Male" : r.gender === 1 ? "Female" : "—"}`, 40, y + 42);

  // Risk gauge box
  y += 70;
  doc.setDrawColor(...tierColor);
  doc.setLineWidth(1.5);
  doc.roundedRect(40, y, W - 80, 130, 8, 8);

  // Gauge arc
  const cx = 110, cy = y + 75, rad = 38;
  doc.setLineWidth(8);
  doc.setDrawColor(230, 220, 215);
  drawArc(doc, cx, cy, rad, -180, 0);
  doc.setDrawColor(...tierColor);
  drawArc(doc, cx, cy, rad, -180, -180 + (r.risk_score / 100) * 180);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...tierColor);
  doc.text(`${r.risk_score}%`, cx, cy + 4, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 100, 95);
  doc.text("RISK TIER", 200, y + 35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...tierColor);
  doc.text(tier, 200, y + 60);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 100, 95);
  doc.text("BMI", 200, y + 85);
  doc.setFontSize(13);
  doc.setTextColor(30, 25, 22);
  doc.text(Number(r.bmi).toFixed(1), 200, y + 102);

  doc.setFontSize(9);
  doc.setTextColor(110, 100, 95);
  doc.text("BLOOD PRESSURE", 320, y + 85);
  doc.setFontSize(13);
  doc.setTextColor(30, 25, 22);
  doc.text(`${r.ap_hi} / ${r.ap_lo} mmHg`, 320, y + 102);

  // Clinical inputs grid
  y += 160;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 25, 22);
  doc.text("Clinical inputs", 40, y);
  doc.setLineWidth(0.5);
  doc.setDrawColor(220, 210, 205);
  doc.line(40, y + 6, W - 40, y + 6);

  y += 24;
  const fields: [string, string][] = [
    ["Height", r.height ? `${r.height} cm` : "—"],
    ["Weight", r.weight ? `${r.weight} kg` : "—"],
    ["Cholesterol", lvl(r.cholesterol)],
    ["Glucose", lvl(r.gluc)],
    ["Smoker", yn(r.smoke)],
    ["Alcohol use", yn(r.alco)],
    ["Physically active", yn(r.active)],
  ];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  fields.forEach(([k, v], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 40 + col * ((W - 80) / 2);
    const yy = y + row * 26;
    doc.setTextColor(110, 100, 95);
    doc.text(k, x, yy);
    doc.setTextColor(30, 25, 22);
    doc.text(v, x + 130, yy);
  });

  // Notes
  y += Math.ceil(fields.length / 2) * 26 + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Clinical interpretation", 40, y);
  doc.setLineWidth(0.5);
  doc.line(40, y + 6, W - 40, y + 6);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 50, 45);
  const note =
    r.risk_tier === "high"
      ? "Elevated cardiovascular risk detected. Recommend immediate clinical review, lipid panel, and lifestyle counselling. Consider 10-year ASCVD calculation and pharmacological intervention as indicated."
      : r.risk_tier === "mid"
        ? "Moderate cardiovascular risk. Recommend follow-up assessment, blood pressure monitoring, and modifiable-risk-factor counselling (diet, exercise, smoking cessation if applicable)."
        : "Low cardiovascular risk on current screening. Maintain regular physical activity, balanced diet, and routine annual screening.";
  const lines = doc.splitTextToSize(note, W - 80);
  doc.text(lines, 40, y);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(140, 130, 125);
  doc.text(
    "Generated by CardioSense XGBoost classifier. This report is screening-only and not a substitute for clinical judgement.",
    40, H - 30,
  );
  doc.text(`Page 1 / 1`, W - 40, H - 30, { align: "right" });

  return doc;
}

function drawArc(doc: jsPDF, cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  // Approximate arc with line segments
  const steps = 40;
  const start = (startDeg * Math.PI) / 180;
  const end = (endDeg * Math.PI) / 180;
  const stepA = (end - start) / steps;
  for (let i = 0; i < steps; i++) {
    const a1 = start + i * stepA;
    const a2 = start + (i + 1) * stepA;
    doc.line(cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2));
  }
}

export function downloadPdf(r: ReportRecord) {
  const doc = buildReport(r);
  doc.save(`cardiosense-${r.patient_name.replace(/\s+/g, "-").toLowerCase()}-${r.id.slice(0, 6)}.pdf`);
}
