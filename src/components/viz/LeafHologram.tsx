import { cn } from "@/lib/cn";

/** Ilustrasi daun holografik dengan node sensor dan akar. Murni dekoratif. */
export function LeafHologram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 320" className={cn("anim-drift", className)} aria-hidden fill="none">
      <defs>
        <linearGradient id="lh-g" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#247BFF" />
          <stop offset="1" stopColor="#27C7F5" />
        </linearGradient>
        <radialGradient id="lh-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#27C7F5" stopOpacity="0.25" />
          <stop offset="1" stopColor="#27C7F5" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="170" cy="140" r="130" fill="url(#lh-glow)" />
      {/* cincin pemindai */}
      <circle cx="170" cy="140" r="112" stroke="#27C7F5" strokeOpacity="0.14" strokeDasharray="2 6" />
      <circle cx="170" cy="140" r="86" stroke="#247BFF" strokeOpacity="0.18" />
      {/* daun */}
      <path d="M96 222C96 140 150 70 248 60c-6 98-66 160-152 162Z" fill="url(#lh-g)" fillOpacity="0.09" stroke="url(#lh-g)" strokeWidth="1.5" />
      <path d="M96 222 228 82" stroke="url(#lh-g)" strokeWidth="1.2" />
      {[
        [120, 196, 118, 160],
        [142, 172, 150, 136],
        [164, 149, 182, 110],
        [186, 126, 210, 92],
        [134, 184, 168, 186],
        [158, 159, 194, 160],
        [182, 134, 220, 128],
      ].map(([x1, y1, x2, y2], i) => (
        <path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} stroke="#27C7F5" strokeOpacity="0.45" />
      ))}
      {/* node sensor */}
      {[
        [118, 160],
        [150, 136],
        [182, 110],
        [168, 186],
        [194, 160],
        [220, 128],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="5" fill="#27C7F5" fillOpacity="0.15" />
          <circle cx={cx} cy={cy} r="2" fill="#27C7F5" />
        </g>
      ))}
      {/* akar */}
      <path d="M96 222c-4 20-16 34-30 44M96 222c6 22 2 40-6 58M96 222c14 14 30 22 50 24" stroke="#247BFF" strokeOpacity="0.35" strokeDasharray="3 4" />
      {/* garis tanah */}
      <path d="M30 236h250" stroke="#91A2BC" strokeOpacity="0.2" />
      <path d="M50 250h200M70 264h150" stroke="#91A2BC" strokeOpacity="0.1" />
    </svg>
  );
}
