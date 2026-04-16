import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const initial =
      stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = async () => {
    const next = theme === "dark" ? "light" : "dark";
    const btn = btnRef.current;

    // Fallback for browsers without View Transitions API
    if (!(document as any).startViewTransition || !btn) {
      setTheme(next);
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem("theme", next);
      return;
    }

    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = (document as any).startViewTransition(() => {
      setTheme(next);
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem("theme", next);
    });

    try {
      await transition.ready;
      const isDark = next === "dark";
      document.documentElement.animate(
        {
          clipPath: isDark
            ? [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]
            : [`circle(${endRadius}px at ${x}px ${y}px)`, `circle(0px at ${x}px ${y}px)`],
        },
        {
          duration: 480,
          easing: "cubic-bezier(0.65, 0, 0.35, 1)",
          pseudoElement: isDark ? "::view-transition-new(root)" : "::view-transition-old(root)",
        },
      );
    } catch {
      /* no-op */
    }
  };

  const isDark = theme === "dark";

  return (
    <button
      ref={btnRef}
      onClick={toggle}
      aria-label="Toggle theme"
      className="theme-toggle-btn group relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-border bg-card text-ink2 transition-all duration-500 hover:text-foreground hover:border-primary/50 hover:scale-110 active:scale-90"
    >
      {/* Animated glow ring */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: isDark
            ? "radial-gradient(circle, oklch(0.8 0.15 65 / 0.25), transparent 70%)"
            : "radial-gradient(circle, oklch(0.45 0.16 25 / 0.20), transparent 70%)",
        }}
      />

      {/* Sun rays burst on click */}
      <span className="theme-burst pointer-events-none absolute inset-0 rounded-full" />

      <Sun
        className="absolute h-[18px] w-[18px] transition-all duration-700"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark
            ? "rotate(-180deg) scale(0.3) translateY(8px)"
            : "rotate(0) scale(1) translateY(0)",
          filter: isDark ? "blur(4px)" : "blur(0)",
        }}
        strokeWidth={1.75}
      />
      <Moon
        className="absolute h-[18px] w-[18px] transition-all duration-700"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark
            ? "rotate(0) scale(1) translateY(0)"
            : "rotate(180deg) scale(0.3) translateY(-8px)",
          filter: isDark ? "blur(0)" : "blur(4px)",
        }}
        strokeWidth={1.75}
      />
    </button>
  );
}
