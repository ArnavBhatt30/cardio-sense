import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "CardioSense — AI Cardiovascular Risk Assessment" },
      {
        name: "description",
        content:
          "Real-time heart disease risk screening powered by an XGBoost classifier trained on ~70,000 patient records.",
      },
    ],
  }),
});

function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <section className="grid items-center gap-12 py-20 md:grid-cols-12 md:py-32">
        <div className="md:col-span-7">
          <div className="eyebrow mb-5">Cardiology · Diagnostic AI</div>
          <h1>
            Heart disease risk, <em>quantified</em> in seconds.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink2">
            CardioSense fuses 11 clinical inputs through an XGBoost classifier trained on
            ~70,000 cardiovascular records — returning a calibrated probability of disease and
            an interpretable breakdown of contributing factors.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/diagnose">Run a diagnosis →</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/about">How it works</Link>
            </Button>
          </div>
        </div>
        <div className="md:col-span-5">
          <div className="surface p-8">
            <div className="eyebrow mb-6">Live model</div>
            <dl className="space-y-5">
              <Stat label="Training samples" value="≈ 70,000" />
              <Stat label="Algorithm" value="XGBoost Classifier" />
              <Stat label="Inference" value="< 200 ms" />
              <Stat label="Output" value="Probability + tier" />
            </dl>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20">
        <div className="eyebrow mb-4">What you get</div>
        <h2 className="mb-12 max-w-2xl">A second opinion, <em>backed by data.</em></h2>
        <div className="grid gap-8 md:grid-cols-3">
          <Feature
            n="01"
            title="Calibrated risk"
            body="A probability score, not just a binary verdict — so clinicians can triage rather than guess."
          />
          <Feature
            n="02"
            title="Vitals breakdown"
            body="Each input is scored against clinical thresholds: BP, BMI, cholesterol, glucose, lifestyle."
          />
          <Feature
            n="03"
            title="Patient history"
            body="Every diagnosis is saved to your private patient log — searchable, timestamped, exportable."
          />
        </div>
      </section>

      <section className="border-t border-border py-16">
        <p className="font-mono text-xs leading-relaxed text-ink3">
          ⚕ For screening and educational use only. CardioSense does not replace a clinical
          diagnosis. Always consult a licensed physician.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border pb-3 last:border-0">
      <dt className="font-mono text-xs uppercase tracking-wider text-ink3">{label}</dt>
      <dd className="font-serif text-lg">{value}</dd>
    </div>
  );
}

function Feature({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <div className="mb-3 font-mono text-xs text-primary">{n}</div>
      <h3 className="mb-2 font-serif text-2xl">{title}</h3>
      <p className="text-ink2 leading-relaxed">{body}</p>
    </div>
  );
}
