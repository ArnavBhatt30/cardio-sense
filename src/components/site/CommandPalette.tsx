import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import { Activity, Home, History, LayoutDashboard, Info, LogOut, Moon, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") {
          if (e.key === "/") return;
        }
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-start justify-items-center bg-foreground/30 px-4 pt-[15vh] backdrop-blur-sm animate-[fade-in_0.15s_ease-out]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-[scale-in_0.18s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command palette" className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-ink3">
          <Command.Input
            placeholder="Search actions, jump to a page…"
            className="w-full border-b border-border bg-transparent px-4 py-3.5 text-sm placeholder:text-ink3 focus:outline-none"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-4 py-6 text-center text-sm text-ink3">No matches.</Command.Empty>
            <Command.Group heading="Navigate">
              <Item onSelect={() => go("/")} icon={<Home className="h-4 w-4" />} label="Home" hint="g h" />
              <Item onSelect={() => go("/dashboard")} icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" hint="g d" />
              <Item onSelect={() => go("/diagnose")} icon={<Activity className="h-4 w-4" />} label="New diagnosis" hint="n" />
              <Item onSelect={() => go("/history")} icon={<History className="h-4 w-4" />} label="History" hint="g r" />
              <Item onSelect={() => go("/about")} icon={<Info className="h-4 w-4" />} label="About" />
            </Command.Group>
            <Command.Group heading="Actions">
              <Item onSelect={toggleTheme} icon={<Sun className="h-4 w-4 dark:hidden" />} label="Toggle theme" hint="⌘ K" altIcon={<Moon className="hidden h-4 w-4 dark:block" />} />
              <Item
                onSelect={async () => { await supabase.auth.signOut(); setOpen(false); navigate({ to: "/" }); }}
                icon={<LogOut className="h-4 w-4" />} label="Sign out"
              />
            </Command.Group>
          </Command.List>
          <div className="border-t border-border bg-bone2/30 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink3">
            ⌘K to toggle · ↵ to select · esc to close
          </div>
        </Command>
      </div>
    </div>
  );
}

function Item({ onSelect, icon, label, hint, altIcon }: {
  onSelect: () => void; icon: React.ReactNode; label: string; hint?: string; altIcon?: React.ReactNode;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm aria-selected:bg-bone2 aria-selected:text-foreground"
    >
      <span className="text-ink2">{icon}{altIcon}</span>
      <span className="flex-1">{label}</span>
      {hint && <span className="font-mono text-[10px] text-ink3">{hint}</span>}
    </Command.Item>
  );
}
