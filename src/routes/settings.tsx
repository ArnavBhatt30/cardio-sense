import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — CardioSense" },
      { name: "description", content: "Configure units, sorting and theme preferences." },
    ],
  }),
});

function SettingsPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const s = useSettings();
  const [theme, setTheme] = useState<"light" | "dark">(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth" });
      else setAuthed(true);
    });
  }, [navigate]);

  const setThemePref = (t: "light" | "dark") => {
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem("theme", t);
  };

  if (!authed) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <div className="eyebrow eyebrow-dot mb-3">Preferences</div>
      <h1 className="mb-12">Settings</h1>

      <Group title="Units" caption="Display units across the app. Stored data remains metric.">
        <Choice
          label="Weight"
          options={[{ v: "kg", l: "Kilograms" }, { v: "lb", l: "Pounds" }]}
          value={s.weightUnit}
          onChange={(v) => s.update({ weightUnit: v as "kg" | "lb" })}
        />
        <Choice
          label="Height"
          options={[{ v: "cm", l: "Centimetres" }, { v: "in", l: "Inches" }]}
          value={s.heightUnit}
          onChange={(v) => s.update({ heightUnit: v as "cm" | "in" })}
        />
      </Group>

      <Group title="Appearance" caption="Theme and visual preferences.">
        <Choice
          label="Theme"
          options={[{ v: "light", l: "Light" }, { v: "dark", l: "Dark" }]}
          value={theme}
          onChange={(v) => setThemePref(v as "light" | "dark")}
        />
      </Group>

      <Group title="History" caption="Default sorting on the History page.">
        <Choice
          label="Sort by"
          options={[
            { v: "created_at", l: "Most recent" },
            { v: "risk_score", l: "Risk score" },
            { v: "patient_name", l: "Patient name" },
            { v: "bmi", l: "BMI" },
          ]}
          value={s.defaultSort}
          onChange={(v) => s.update({ defaultSort: v as never })}
        />
      </Group>

      <div className="mt-12 flex items-center justify-between border-t border-border pt-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink3">
          Preferences are stored on this device only.
        </p>
        <Button variant="outline" size="sm" onClick={() => { s.reset(); toast.success("Settings reset"); }}>
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}

function Group({ title, caption, children }: { title: string; caption: string; children: React.ReactNode }) {
  return (
    <section className="mb-12 grid gap-8 md:grid-cols-[200px_1fr]">
      <div>
        <h3 className="font-serif text-xl">{title}</h3>
        <p className="mt-1.5 text-xs text-ink3">{caption}</p>
      </div>
      <div className="surface-raised divide-y divide-border">{children}</div>
    </section>
  );
}

function Choice({ label, options, value, onChange }: {
  label: string; options: { v: string; l: string }[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <span className="text-sm text-ink2">{label}</span>
      <div className="flex rounded-md border border-border p-0.5">
        {options.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              onClick={() => onChange(o.v)}
              className={`rounded px-3 py-1.5 text-xs transition-all ${
                active ? "bg-primary text-primary-foreground" : "text-ink2 hover:text-foreground"
              }`}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}
