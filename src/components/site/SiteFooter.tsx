import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-serif text-2xl leading-none">CardioSense</div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink2">
            A clinical-grade screening instrument powered by gradient-boosted machine
            learning, returning calibrated cardiovascular risk in milliseconds.
          </p>
        </div>
        <div>
          <div className="eyebrow mb-4">Product</div>
          <ul className="space-y-2 text-sm text-ink2">
            <li><Link to="/diagnose" className="hover:text-foreground">Diagnose</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
            <li><Link to="/history" className="hover:text-foreground">History</Link></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-4">Information</div>
          <ul className="space-y-2 text-sm text-ink2">
            <li><Link to="/about" className="hover:text-foreground">Methodology</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-6 py-5 font-mono text-[10px] uppercase tracking-widest text-ink3 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} CardioSense — for screening use only.</span>
          <span>XGBoost · Flask · Lovable Cloud</span>
        </div>
      </div>
    </footer>
  );
}
