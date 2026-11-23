/**
 * Latar dekoratif: garis kontur topografi, batas petak lahan, penanda koordinat grid,
 * dan jalur sirkuit tipis. Hanya hiasan (aria-hidden, tidak bisa diklik).
 */
export function FieldBackdrop() {
  return (
    <svg
      className="pointer-events-none fixed inset-0 -z-0 h-full w-full opacity-70"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1440 900"
      aria-hidden
    >
      <defs>
        <radialGradient id="fb-fade" cx="0.8" cy="0.15" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="fb-mask">
          <rect width="1440" height="900" fill="url(#fb-fade)" />
        </mask>
      </defs>

      {/* Kontur topografi */}
      <g mask="url(#fb-mask)" fill="none" stroke="#27C7F5" strokeOpacity="0.07">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path
            key={i}
            d={`M ${820 - i * 40} ${120 - i * 6} C ${980 - i * 20} ${20 - i * 30}, ${1300 + i * 25} ${40 - i * 10}, ${1360 + i * 30} ${190 + i * 22} S ${1180 + i * 10} ${420 + i * 38}, ${980 - i * 30} ${330 + i * 30} S ${760 - i * 45} ${220 + i * 10}, ${820 - i * 40} ${120 - i * 6} Z`}
          />
        ))}
      </g>

      {/* Petak lahan (batas sawah) */}
      <g fill="none" stroke="#247BFF" strokeOpacity="0.06">
        <path d="M-20 700 L 260 640 L 330 760 L 40 860 Z" />
        <path d="M260 640 L 520 600 L 600 720 L 330 760 Z" />
        <path d="M40 860 L 330 760 L 380 900" />
        <path d="M330 760 L 600 720 L 640 900" />
      </g>

      {/* Jalur sirkuit & node sensor */}
      <g stroke="#27C7F5" strokeOpacity="0.08" fill="none">
        <path d="M1440 620 H 1260 L 1220 580 H 1100" />
        <path d="M1440 660 H 1300 L 1270 690 H 1160" />
      </g>
      <g fill="#27C7F5" fillOpacity="0.18">
        <circle cx="1100" cy="580" r="2.5" />
        <circle cx="1160" cy="690" r="2.5" />
        <circle cx="260" cy="640" r="2" />
        <circle cx="600" cy="720" r="2" />
      </g>

      {/* Penanda koordinat grid */}
      <g fill="#91A2BC" fillOpacity="0.16" fontSize="10" fontFamily="ui-monospace, monospace" letterSpacing="1">
        {[
          [300, 132, "A2"],
          [1188, 352, "C7"],
          [176, 528, "B1"],
          [968, 792, "E5"],
        ].map(([x, y, t]) => (
          <g key={String(t)}>
            <path d={`M ${Number(x) - 6} ${y} h 12 M ${x} ${Number(y) - 6} v 12`} stroke="#91A2BC" strokeOpacity="0.2" />
            <text x={Number(x) + 9} y={Number(y) - 6}>
              {t}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
