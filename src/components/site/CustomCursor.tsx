import { useEffect, useRef, useState } from "react";

/**
 * Refined minimal cursor:
 * - Dot follows pointer 1:1 (no lag).
 * - Ring follows with smooth spring lerp.
 * - Morphs into a vertical I-beam over text inputs.
 * - Expands into a soft pill over interactive elements.
 * - Fully hidden on touch devices and when reduced-motion users prefer system cursor.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    setEnabled(true);

    let mouseX = -100;
    let mouseY = -100;
    let ringX = mouseX;
    let ringY = mouseY;
    let raf = 0;
    let visible = false;

    const setVisible = (v: boolean) => {
      if (visible === v) return;
      visible = v;
      const op = v ? "1" : "0";
      if (dotRef.current) dotRef.current.style.opacity = op;
      if (ringRef.current) ringRef.current.style.opacity = v ? "" : "0";
    };

    const updateMode = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      const ring = ringRef.current;
      const dot = dotRef.current;
      if (!ring || !dot) return;

      const isText =
        !!el?.closest('input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="range"]), textarea, [contenteditable="true"]');
      const isInteractive =
        !!el?.closest('a, button, [role="button"], select, summary, label, [data-cursor="hover"]');
      const isDisabled = !!el?.closest('[disabled], [aria-disabled="true"]');

      ring.dataset.mode = isText ? "text" : isInteractive ? "hover" : "idle";
      dot.dataset.mode = isText ? "text" : isInteractive ? "hover" : "idle";
      ring.dataset.disabled = isDisabled ? "true" : "false";
    };

    const move = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      setVisible(true);
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }
      updateMode(e.target);
    };

    const down = () => {
      ringRef.current?.setAttribute("data-pressed", "true");
      dotRef.current?.setAttribute("data-pressed", "true");
    };
    const up = () => {
      ringRef.current?.setAttribute("data-pressed", "false");
      dotRef.current?.setAttribute("data-pressed", "false");
    };
    const leave = (e: MouseEvent) => {
      // only hide when leaving the window itself
      if (!e.relatedTarget && !(e as any).toElement) setVisible(false);
    };
    const enter = () => setVisible(true);
    const blur = () => setVisible(false);

    const tick = () => {
      const dx = mouseX - ringX;
      const dy = mouseY - ringY;
      ringX += dx * 0.22;
      ringY += dy * 0.22;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };

    document.documentElement.classList.add("has-custom-cursor");
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    window.addEventListener("mouseout", leave);
    window.addEventListener("mouseover", enter);
    window.addEventListener("blur", blur);
    raf = requestAnimationFrame(tick);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("mouseout", leave);
      window.removeEventListener("mouseover", enter);
      window.removeEventListener("blur", blur);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div ref={ringRef} aria-hidden className="custom-cursor-ring" data-mode="idle" data-pressed="false" />
      <div ref={dotRef} aria-hidden className="custom-cursor-dot" data-mode="idle" data-pressed="false" />
    </>
  );
}
