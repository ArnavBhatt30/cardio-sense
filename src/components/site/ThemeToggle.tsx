import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeMode = "light" | "dark";

function setTheme(next: ThemeMode) {
  document.documentElement.classList.toggle("dark", next === "dark");
  localStorage.setItem("theme", next);
}

function runThemePulse(x: number, y: number, next: ThemeMode) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const pulse = document.createElement("span");
  const maxRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  pulse.className = "theme-pulse";
  pulse.style.left = `${x}px`;
  pulse.style.top = `${y}px`;
  pulse.style.width = `${maxRadius * 2}px`;
  pulse.style.height = `${maxRadius * 2}px`;
  pulse.dataset.theme = next;
  document.body.appendChild(pulse);

  requestAnimationFrame(() => {
    pulse.classList.add("is-active");
  });

  pulse.addEventListener("animationend", () => pulse.remove(), { once: true });
}

export function ThemeToggle() {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeMode | null;
    const initial =
      stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setThemeState(initial);
    setTheme(initial);
  }, []);

  const toggle = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    const btn = btnRef.current;

    if (btn) {
      const rect = btn.getBoundingClientRect();
      runThemePulse(rect.left + rect.width / 2, rect.top + rect.height / 2, next);
    }

    setThemeState(next);
    setTheme(next);
  };

  const isDark = theme === "dark";

  return (
    <button
      ref={btnRef}
      onClick={toggle}
      aria-label="Toggle theme"
      className="theme-toggle-btn group relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-border bg-card text-ink2 transition-transform duration-300 hover:scale-110 hover:border-primary/50 hover:text-foreground active:scale-95"
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: isDark
            ? "radial-gradient(circle, oklch(0.8 0.15 65 / 0.25), transparent 70%)"
            : "radial-gradient(circle, oklch(0.45 0.16 25 / 0.20), transparent 70%)",
        }}
      />
      <span className="theme-burst pointer-events-none absolute inset-0 rounded-full" />
      <span
        className="pointer-events-none absolute inset-[6px] rounded-full border border-primary/20 transition-all duration-300"
        style={{ transform: isDark ? "scale(1)" : "scale(0.72)", opacity: isDark ? 1 : 0.55 }}
      />
      <Sun
        className="absolute h-[18px] w-[18px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? "rotate(-120deg) scale(0.4)" : "rotate(0deg) scale(1)",
        }}
        strokeWidth={1.75}
      />
      <Moon
        className="absolute h-[18px] w-[18px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? "rotate(0deg) scale(1)" : "rotate(120deg) scale(0.4)",
        }}
        strokeWidth={1.75}
      />
    </button>
  );
}
