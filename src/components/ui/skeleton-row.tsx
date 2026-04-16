export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-bone2/60 ${className}`}
      style={{ minHeight: 12 }}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--foreground) 6%, transparent) 50%, transparent 100%)",
        }}
      />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="border-t border-border">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <SkeletonBlock className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
