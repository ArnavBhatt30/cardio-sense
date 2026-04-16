import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About CardioSense — Model & Methodology" },
      {
        name: "description",
        content:
          "How the CardioSense XGBoost cardiovascular risk model was trained, evaluated, and deployed.",
      },
    ],
  }),
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <div className="eyebrow mb-4">Documentation</div>
      <h1 className="mb-8">About the <em>model</em></h1>
      <p className="text-lg leading-relaxed text-ink2">
        CardioSense uses an XGBoost gradient-boosted classifier trained on the public
        Cardiovascular Disease Dataset (Kaggle), supplemented by Framingham study features —
        approximately 70,000 patient records in total. The model is deployed as a Flask API
        on Railway and queried in real time from this site.
      </p>

      <Section title="Inputs" rows={[
        ["Age (years)", "1–100"],
        ["Gender", "1 = women, 2 = men"],
        ["Height (cm) & Weight (kg)", "Used to derive BMI"],
        ["Systolic / Diastolic BP", "mmHg"],
        ["Cholesterol", "1 normal, 2 above normal, 3 well above normal"],
        ["Glucose", "1 normal, 2 above normal, 3 well above normal"],
        ["Smoke / Alcohol / Active", "Binary lifestyle factors"],
      ]} />

      <Section title="Model" rows={[
        ["Algorithm", "XGBoost Classifier"],
        ["Training samples", "~70,000"],
        ["Output", "Probability + binary prediction"],
        ["Deployment", "Flask API on Railway"],
      ]} />

      <Section title="Limitations" rows={[
        ["Not a diagnostic tool", "Screening only — never replaces clinical judgement."],
        ["Population bias", "Training data skews European adult demographics."],
        ["Static features", "No time-series, ECG, or imaging signals are used."],
      ]} />

      <p className="mt-12 font-mono text-xs leading-relaxed text-ink3">
        ⚕ Always consult a licensed physician. CardioSense is provided for educational and
        research purposes.
      </p>
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <section className="mt-14">
      <h2 className="mb-6">{title}</h2>
      <dl className="divide-y divide-border border-t border-b border-border">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-4 py-3 text-sm">
            <dt className="col-span-1 font-mono text-xs uppercase tracking-wider text-ink3">{k}</dt>
            <dd className="col-span-2 text-ink2">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
