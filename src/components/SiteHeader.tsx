import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setEmail(session?.user.email ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const linkCls = "text-sm tracking-wide text-ink2 hover:text-foreground transition-colors";
  const activeCls = "text-foreground font-medium";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="font-serif text-xl tracking-tight">CardioSense</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className={linkCls} activeProps={{ className: activeCls }} activeOptions={{ exact: true }}>
            Home
          </Link>
          <Link to="/diagnose" className={linkCls} activeProps={{ className: activeCls }}>
            Diagnose
          </Link>
          <Link to="/history" className={linkCls} activeProps={{ className: activeCls }}>
            History
          </Link>
          <Link to="/about" className={linkCls} activeProps={{ className: activeCls }}>
            About
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {email ? (
            <>
              <span className="hidden font-mono text-xs text-ink3 md:inline">{email}</span>
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
