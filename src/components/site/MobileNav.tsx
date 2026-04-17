import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Heart } from "lucide-react";

type NavItem = { to: string; label: string };

export function MobileNav({
  items,
  email,
  onSignOut,
}: {
  items: NavItem[];
  email: string | null;
  onSignOut?: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="grid h-9 w-9 place-items-center rounded-md border border-border md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain bg-background md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex min-h-dvh flex-col bg-background">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-full border border-primary/30 bg-primary/5 text-primary">
                <Heart className="h-3.5 w-3.5" fill="currentColor" />
              </span>
              <span className="font-serif text-xl tracking-tight">CardioSense</span>
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-md border border-border"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center gap-2 px-8">
            {items.map((item, idx) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="group flex items-baseline gap-4 border-b border-border/60 py-4 transition-transform"
                style={{
                  transitionDelay: open ? `${80 + idx * 50}ms` : "0ms",
                  transform: open ? "translateY(0)" : "translateY(12px)",
                  opacity: open ? 1 : 0,
                  transitionProperty: "transform, opacity",
                  transitionDuration: "500ms",
                }}
                activeProps={{ className: "text-primary" }}
              >
                <span className="w-6 font-mono text-[10px] uppercase tracking-widest text-ink3">
                  0{idx + 1}
                </span>
                <span className="font-serif text-3xl tracking-tight transition-transform group-hover:translate-x-1">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="border-t border-border px-8 py-6">
            {email ? (
              <div className="flex items-center justify-between gap-4">
                <span className="truncate font-mono text-[11px] text-ink3">{email}</span>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSignOut?.();
                  }}
                  className="rounded-md border border-border px-3 py-1.5 text-xs"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="block w-full rounded-md bg-primary px-4 py-2.5 text-center text-sm text-primary-foreground"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
