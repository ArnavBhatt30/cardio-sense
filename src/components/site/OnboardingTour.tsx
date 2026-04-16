import { useEffect, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = { title: string; body: string; selector: string };

const STEPS: Step[] = [
  {
    title: "Your Dashboard",
    body: "Aggregate stats, risk-tier distribution, and a sparkline of your recent scans.",
    selector: '[data-tour="nav-dashboard"]',
  },
  {
    title: "Run a diagnosis",
    body: "Enter 11 clinical inputs and get a calibrated XGBoost risk score in milliseconds.",
    selector: '[data-tour="nav-diagnose"]',
  },
  {
    title: "Patient history",
    body: "Sort, filter, compare and export every saved diagnosis as a branded PDF report.",
    selector: '[data-tour="nav-history"]',
  },
];

const KEY = "cardiosense:tour-completed";

export function OnboardingTour() {
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(KEY)) return;
    const t = setTimeout(() => setStep(0), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (step === null) return;
    const update = () => {
      const el = document.querySelector(STEPS[step].selector) as HTMLElement | null;
      if (el) setRect(el.getBoundingClientRect());
      else setRect(null);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [step]);

  if (step === null) return null;

  const finish = () => {
    localStorage.setItem(KEY, "1");
    setStep(null);
  };
  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : finish());

  const s = STEPS[step];
  const tipTop = rect ? rect.bottom + 12 : 80;
  const tipLeft = rect
    ? Math.max(16, Math.min(window.innerWidth - 336, rect.left + rect.width / 2 - 160))
    : 16;

  return (
    <div className="fixed inset-0 z-[60] animate-[fade-in_0.25s_ease-out]">
      {/* dim overlay with cutout */}
      <svg className="absolute inset-0 h-full w-full" pointerEvents="none">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - 6} y={rect.top - 6}
                width={rect.width + 12} height={rect.height + 12}
                rx="10" fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="oklch(0.18 0.02 45 / 0.55)" mask="url(#tour-mask)" />
        {rect && (
          <rect
            x={rect.left - 6} y={rect.top - 6}
            width={rect.width + 12} height={rect.height + 12}
            rx="10" fill="none" stroke="var(--primary)" strokeWidth="2"
            style={{ filter: "drop-shadow(0 0 12px var(--primary))" }}
          />
        )}
      </svg>

      <div
        className="absolute w-80 rounded-xl border border-border bg-card p-5 shadow-2xl animate-[scale-in_0.2s_ease-out]"
        style={{ top: tipTop, left: tipLeft }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink3">
            Step {step + 1} / {STEPS.length}
          </span>
          <button onClick={finish} className="text-ink3 hover:text-foreground" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="mb-2 font-serif text-lg">{s.title}</h3>
        <p className="mb-4 text-sm text-ink2">{s.body}</p>
        <div className="flex items-center justify-between">
          <button onClick={finish} className="font-mono text-[10px] uppercase tracking-widest text-ink3 hover:text-foreground">
            Skip tour
          </button>
          <Button size="sm" onClick={next}>
            {step < STEPS.length - 1 ? <>Next <ChevronRight className="h-3.5 w-3.5" /></> : "Got it"}
          </Button>
        </div>
        <div className="mt-3 flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-0.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
