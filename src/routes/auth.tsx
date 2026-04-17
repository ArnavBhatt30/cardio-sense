import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — CardioSense" },
      { name: "description", content: "Sign in or create an account to access CardioSense." },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Account created.");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in.");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/dashboard`,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 lg:grid-cols-2">
      {/* Editorial side */}
      <aside className="relative hidden flex-col justify-between border-r border-border bg-bone2/40 px-12 py-14 lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-primary/30 bg-primary/5 text-primary">
            <Heart className="h-3.5 w-3.5" fill="currentColor" />
          </span>
          <span className="font-serif text-xl">CardioSense</span>
        </Link>

        <div>
          <div className="eyebrow eyebrow-dot mb-5">Welcome back</div>
          <h1 className="text-[clamp(2.5rem,4.5vw,4rem)]">
            Eleven signals. <br/>
            <em>One readout.</em> <br/>
            Saved to your <br/>
            private log.
          </h1>
          <p className="mt-8 max-w-md text-[15px] leading-relaxed text-ink2">
            Sign in to run cardiovascular risk diagnostics and review your patient history —
            secured by row-level access on every record.
          </p>
        </div>

        <div className="font-mono text-[10px] uppercase tracking-widest text-ink3">
          XGBoost · Flask · Postgres
        </div>
      </aside>

      {/* Form side */}
      <div className="flex items-center justify-center px-6 py-14 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="eyebrow mb-3">{mode === "signin" ? "Sign in" : "Create account"}</div>
          <h2 className="mb-10 font-serif text-4xl">
            {mode === "signin" ? <>Welcome <em>back</em></> : <>Get <em>started</em></>}
          </h2>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={googleLoading}
            onClick={onGoogle}
          >
            <GoogleIcon />
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </Button>

          <div className="my-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-ink3">
            <span className="h-px flex-1 bg-border" />
            or with email
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-ink2">Email</Label>
              <Input id="email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs text-ink2">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-ink2">
            {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
            <button
              className="font-medium text-primary hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>

          <p className="mt-12 font-mono text-[10px] uppercase tracking-widest text-ink3">
            <Link to="/" className="hover:text-foreground">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="mr-2">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
