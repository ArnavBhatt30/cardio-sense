import { useEffect, useRef, useState } from "react";

/**
 * Premium minimal cursor.
 * - Single blob that follows the pointer with velocity-based stretch.
 * - Uses mix-blend-mode: difference so it's always visible on any background.
 * - Morphs into a thin I-beam over text inputs.
 * - Expands into a soft pill (with optional label via data-cursor-label) over interactive elements.
 * - Hidden on touch devices.
 */
export function CustomCursor() {
  const blobRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setActive(true);
  }, []);

  useEffect(() => {
    if (!active) return;

    const blob = blobRef.current;
    const label = labelRef.current;
    if (!blob || !label) return;

    let mx = -200;
    let my = -200;
    let x = mx;
    let y = my;
    let lastX = mx;
    let lastY = my;
    let raf = 0;
    let visible = false;
    let mode: "idle" | "hover" | "text" = "idle";
    let pressed = false;

    const setVisible = (nextVisible: boolean) => {
      if (visible === nextVisible) return;
      visible = nextVisible;
      blob.style.opacity = nextVisible ? "1" : "0";
    };

    const apply = () => {
      blob.dataset.mode = mode;
      blob.dataset.pressed = pressed ? "true" : "false";
    };

    const updateMode = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      const text = el?.closest(
        'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="range"]):not([type="color"]), textarea, [contenteditable="true"]',
      );
      const interactive = el?.closest(
        'a, button, [role="button"], select, summary, label[for], [data-cursor="hover"]',
      ) as HTMLElement | null;
      const labelText = interactive?.dataset?.cursorLabel ?? "";

      mode = text ? "text" : interactive ? "hover" : "idle";
      label.textContent = labelText;
      label.style.opacity = labelText ? "1" : "0";
      apply();
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      setVisible(true);
      updateMode(e.target);
    };

    const onDown = () => {
      pressed = true;
      apply();
    };

    const onUp = () => {
      pressed = false;
      apply();
    };

    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) setVisible(false);
    };

    const onOver = () => setVisible(true);
    const onBlur = () => setVisible(false);

    const tick = () => {
      x += (mx - x) * 0.28;
      y += (my - y) * 0.28;

      const vx = x - lastX;
      const vy = y - lastY;
      lastX = x;
      lastY = y;

      let scaleX = 1;
      let scaleY = 1;
      let rotate = 0;

      if (mode === "idle" && !pressed) {
        const speed = Math.min(Math.hypot(vx, vy), 60);
        const stretch = speed / 60;
        scaleX = 1 + stretch * 0.6;
        scaleY = 1 - stretch * 0.35;
        rotate = (Math.atan2(vy, vx) * 180) / Math.PI;
      }

      blob.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rotate}deg) scale(${scaleX}, ${scaleY})`;
      raf = requestAnimationFrame(tick);
    };

    document.documentElement.classList.add("has-custom-cursor");
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mouseout", onOut);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("blur", onBlur);
    apply();
    raf = requestAnimationFrame(tick);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mouseout", onOut);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("blur", onBlur);
      cancelAnimationFrame(raf);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div ref={blobRef} aria-hidden className="cs-cursor" data-mode="idle" data-pressed="false">
      <span ref={labelRef} className="cs-cursor-label" />
    </div>
  );
}
