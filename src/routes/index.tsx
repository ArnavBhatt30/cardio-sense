import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Database, ShieldCheck } from "lucide-react";

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
    <div className="mx-auto max-w-7xl px-6">
      {/* HERO */}
      <section className="grid items-end gap-12 py-20 md:grid-cols-12 md:py-32">
        <div className="md:col-span-7">
          <div className="eyebrow eyebrow-dot mb-6">Cardiology · Diagnostic AI · v1.0</div>
          <h1>
            A second opinion <br />
            on the <em>heart</em>, in <br />
            two hundred milliseconds.
          </h1>
          <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-ink2">
            CardioSense fuses eleven clinical signals through a gradient-boosted classifier
            trained on roughly seventy-thousand cardiovascular records — returning a calibrated
            probability of disease and a transparent, factor-by-factor breakdown.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <Link to="/diagnose">Run a diagnosis <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Link to="/about" className="font-mono text-xs uppercase tracking-widest text-ink3 hover:text-foreground">
              Read the methodology →
            </Link>
          </div>
        </div>

        {/* Sample readout card */}
        <div className="md:col-span-5">
          <SampleReadout />
        </div>
      </section>

      {/* STATS BAND */}
      <section className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
        <Stat n="≈ 70K" label="Training samples" />
        <Stat n="11" label="Clinical inputs" />
        <Stat n="< 200ms" label="Inference time" />
        <Stat n="0–100%" label="Calibrated output" />
      </section>

      {/* FEATURES */}
      <section className="py-28">
        <div className="mb-16 grid items-end gap-6 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="eyebrow mb-3">What you get</div>
            <h2>Quantified risk, <em>backed by data.</em></h2>
          </div>
          <p className="text-ink2 md:col-span-5">
            Every diagnosis returns three artefacts — a number, a story, and a record. Together
            they support a clinical conversation rather than replace one.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-3">
          <Feature
            n="01"
            icon={<Activity className="h-4 w-4" />}
            title="Calibrated probability"
            body="A continuous probability score — not a binary verdict — so you can triage rather than guess."
          />
          <Feature
            n="02"
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Vitals breakdown"
            body="Each input scored against clinical thresholds: BP, BMI, cholesterol, glucose, lifestyle."
          />
          <Feature
            n="03"
            icon={<Database className="h-4 w-4" />}
            title="Private patient log"
            body="Every diagnosis is timestamped and saved to your account — searchable and exportable."
          />
        </div>
      </section>

      {/* METHODOLOGY ROW */}
      <section className="border-t border-border py-24">
        <div className="grid gap-16 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="eyebrow mb-3">Under the hood</div>
            <h2>Boosted trees on <em>tabular reality.</em></h2>
          </div>
          <div className="space-y-6 text-ink2 md:col-span-7">
            <p>
              CardioSense is built on XGBoost — a gradient-boosted tree ensemble that excels at
              the structured, mixed-type tabular data that defines clinical screening. The
              underlying corpus combines the public Cardiovascular Disease Dataset with
              Framingham-derived features.
            </p>
            <p>
              Inference is delegated to a dedicated Flask service on Railway, called from a
              type-safe TanStack server function. The score is returned, displayed, and
              persisted to a row-level-secured patient record.
            </p>
            <Link to="/about" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
              Full methodology <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="my-24 overflow-hidden rounded-2xl border border-border bg-foreground text-bone">
        <div className="grid items-center gap-10 p-12 md:grid-cols-12">
          <div className="md:col-span-8">
            <div className="font-mono text-[10px] uppercase tracking-widest text-bone/60">Ready when you are</div>
            <h2 className="mt-3 text-bone">
              Eleven inputs. <em className="text-amber">One readout.</em>
            </h2>
          </div>
          <div className="md:col-span-4 md:text-right">
            <Button asChild size="lg" variant="secondary" className="bg-bone text-foreground hover:bg-bone2">
              <Link to="/diagnose">Begin diagnosis →</Link>
            </Button>
          </div>
        </div>
      </section>

      <p className="border-t border-border py-10 text-center font-mono text-[10px] uppercase tracking-widest text-ink3">
        ⚕ For screening and educational use only — never replaces clinical judgement
      </p>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="bg-card px-6 py-8">
      <div className="display-numeral text-4xl">{n}</div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink3">{label}</div>
    </div>
  );
}

function Feature({ n, icon, title, body }: {
  n: string; icon: React.ReactNode; title: string; body: string;
}) {
  return (
    <div className="border-t border-border pt-6">
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest text-ink4">{n}</span>
        <span className="grid h-8 w-8 place-items-center rounded-full border border-border text-ink2">{icon}</span>
      </div>
      <h3 className="mb-3 font-serif text-2xl">{title}</h3>
      <p className="leading-relaxed text-ink2">{body}</p>
    </div>
  );
}

function SampleReadout() {
  return (
    <div className="surface-raised overflow-hidden">
      <div className="border-b border-border bg-bone2/40 px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-ink3">
        Sample readout · MRN-1024
      </div>
      <div className="grid grid-cols-[auto_1fr] items-center gap-6 p-7">
        <div className="relative">
          <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r="48" fill="none" stroke="var(--border)" strokeWidth="2" />
            <circle cx="60" cy="60" r="48" fill="none" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${0.72 * 2 * Math.PI * 48} ${2 * Math.PI * 48}`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="display-numeral text-4xl text-primary">72<span className="text-base align-top">%</span></div>
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-ink3">High</div>
          </div>
        </div>
        <div>
          <div className="font-serif text-lg leading-tight">Patient <em>over fifty</em>,<br/> sedentary, hypertensive.</div>
          <div className="mt-3 font-mono text-[10px] text-ink3">SYS 156 · DIA 92 · BMI 31.4</div>
        </div>
      </div>
      <div className="space-y-2 border-t border-border bg-bone2/20 px-7 py-5">
        {[
          ["Hypertension", "danger"],
          ["Obesity", "warn"],
          ["Sedentary", "warn"],
        ].map(([t, k]) => (
          <div key={t} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink2">
            <span className="h-1 w-1 rounded-full" style={{ background: k === "danger" ? "var(--primary)" : "var(--amber)" }} />
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}
