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
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
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

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        {/* backdrop */}
        <div
          className={`absolute inset-0 bg-background transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />

        {/* panel */}
        <div
          className={`relative flex h-full flex-col bg-background transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
          }`}
        >
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
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink3 w-6">
                  0{idx + 1}
                </span>
                <span className="font-serif text-3xl tracking-tight group-hover:translate-x-1 transition-transform">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="border-t border-border px-8 py-6">
            {email ? (
              <div className="flex items-center justify-between">
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
