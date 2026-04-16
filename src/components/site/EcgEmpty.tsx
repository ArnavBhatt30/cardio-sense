export function EcgEmpty({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 80" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M0 40 L80 40 L95 40 L105 20 L115 60 L125 10 L135 50 L150 40 L220 40 L235 40 L245 28 L255 52 L265 40 L320 40"
        style={{
          strokeDasharray: 600,
          strokeDashoffset: 600,
          animation: "ecg-draw 2.4s ease-out forwards",
        }}
      />
      <style>{`@keyframes ecg-draw { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
}
