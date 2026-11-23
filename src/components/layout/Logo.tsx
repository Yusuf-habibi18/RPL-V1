import { cn } from "@/lib/cn";

/** Logo: daun digital dengan gelombang sinyal sensor. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#247BFF" />
          <stop offset="1" stopColor="#27C7F5" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="#0E1B33" stroke="url(#logo-g)" strokeOpacity="0.55" />
      <path d="M12 29c0-9 6-16 17-17-1 11-8 17-17 17Z" fill="url(#logo-g)" fillOpacity="0.9" />
      <path d="M12 29 24 17" stroke="#0E1B33" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17 24h4M20 21h3" stroke="#0E1B33" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M27 27a5 5 0 0 0 3-3" stroke="#27C7F5" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M27 31a9 9 0 0 0 7-7" stroke="#27C7F5" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <div className="leading-none">
        <p className="text-[15px] font-bold tracking-tight">
          Agri<span className="text-cyan">-</span>Analytics
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Smart Farming</p>
      </div>
    </div>
  );
}
