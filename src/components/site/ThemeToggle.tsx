import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as "light" | "dark" | null);
    const initial = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  };

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-border bg-card text-ink2 transition-all hover:text-foreground hover:border-primary/40 hover:scale-105 active:scale-95"
    >
      <Sun
        className="theme-toggle-icon absolute h-4 w-4"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? "rotate(-90deg) scale(0.5)" : "rotate(0) scale(1)",
        }}
      />
      <Moon
        className="theme-toggle-icon absolute h-4 w-4"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? "rotate(0) scale(1)" : "rotate(90deg) scale(0.5)",
        }}
      />
    </button>
  );
}
