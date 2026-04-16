import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setEmail(session?.user.email ?? null),
    );
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const linkCls = "text-[13px] tracking-wide text-ink2 hover:text-foreground transition-colors";
  const activeCls = "text-foreground";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-primary/30 bg-primary/5 text-primary transition-transform group-hover:scale-105">
            <Heart className="h-3.5 w-3.5" fill="currentColor" />
          </span>
          <span className="font-serif text-xl leading-none tracking-tight">CardioSense</span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          <Link to="/" className={linkCls} activeProps={{ className: activeCls }} activeOptions={{ exact: true }}>
            Home
          </Link>
          {email && (
            <>
              <Link to="/dashboard" className={linkCls} activeProps={{ className: activeCls }}>
                Dashboard
              </Link>
              <Link to="/diagnose" className={linkCls} activeProps={{ className: activeCls }}>
                Diagnose
              </Link>
              <Link to="/history" className={linkCls} activeProps={{ className: activeCls }}>
                History
              </Link>
            </>
          )}
          <Link to="/about" className={linkCls} activeProps={{ className: activeCls }}>
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {email ? (
            <>
              <span className="hidden font-mono text-[11px] text-ink3 md:inline">{email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/" });
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
