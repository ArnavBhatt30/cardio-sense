import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About CardioSense — Model & Methodology" },
      {
        name: "description",
        content: "How the CardioSense XGBoost cardiovascular risk model was trained, evaluated, and deployed.",
      },
    ],
  }),
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-24">
      <div className="eyebrow eyebrow-dot mb-5">Documentation · v1.0</div>
      <h1>The <em>methodology</em>.</h1>

      <p className="mt-10 max-w-2xl text-[17px] leading-relaxed text-ink2">
        CardioSense is a cardiovascular risk screening instrument built on a gradient-boosted
        decision tree ensemble. It ingests eleven structured clinical signals and emits a
        calibrated probability of disease, intended as a triage aid — never as a substitute
        for clinical judgement.
      </p>

      <Section
        title="Inputs"
        caption="The eleven signals consumed at inference time."
        rows={[
          ["Age", "Years, integer · 1–120"],
          ["Sex", "1 female · 2 male"],
          ["Height & weight", "cm / kg — used to derive BMI"],
          ["Systolic / diastolic BP", "mmHg"],
          ["Cholesterol", "1 normal · 2 above · 3 well above"],
          ["Glucose", "1 normal · 2 above · 3 well above"],
          ["Smoke / alcohol / active", "Binary lifestyle factors"],
        ]}
      />

      <Section
        title="Model"
        caption="What sits behind the API."
        rows={[
          ["Algorithm", "XGBoost gradient-boosted classifier"],
          ["Training corpus", "≈ 70,000 patient records — Cardiovascular Disease Dataset + Framingham-derived features"],
          ["Output", "Probability ∈ [0, 1] · binary label · model confidence"],
          ["Inference layer", "Flask service on Railway, called via TanStack server function"],
          ["Persistence", "Lovable Cloud Postgres with row-level security per user"],
        ]}
      />

      <Section
        title="Limitations"
        caption="Read these before trusting the number."
        rows={[
          ["Not diagnostic", "Screening only — never replaces clinical judgement."],
          ["Population bias", "Training data skews adult European demographics."],
          ["Static features", "No time-series, ECG, or imaging signals are used."],
          ["Calibration drift", "Probabilities are calibrated on training data; real-world distribution may differ."],
        ]}
      />

      <div className="mt-16 flex items-center justify-between border-t border-border pt-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink3">
          ⚕ For screening and educational use only
        </p>
        <Link to="/diagnose" className="font-mono text-xs uppercase tracking-widest text-primary">
          Try it →
        </Link>
      </div>
    </div>
  );
}

function Section({ title, caption, rows }: { title: string; caption: string; rows: [string, string][] }) {
  return (
    <section className="mt-20 grid gap-10 md:grid-cols-[200px_1fr]">
      <div>
        <h2 className="font-serif text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-ink3">{caption}</p>
      </div>
      <dl className="divide-y divide-border border-y border-border">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-4 py-4 text-sm">
            <dt className="col-span-1 font-mono text-[10px] uppercase tracking-widest text-ink3">{k}</dt>
            <dd className="col-span-2 leading-relaxed text-ink2">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
