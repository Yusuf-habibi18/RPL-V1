// Tema grafik bersama (permukaan gelap).

/**
 * Palet kategori (urutan tetap, tidak diputar ulang). Divalidasi untuk permukaan #111E35:
 * lightness band, chroma, normal-vision ΔE ≥ 15 PASS; CVD ΔE 7.9 (floor band) → selalu
 * disertai legenda/label teks dan celah antar segmen.
 */
export const KATEGORI = ["#4A8DFF", "#DB5C9C", "#1AA3C9", "#9277F0"] as const;

export const WARNA = {
  primary: "#247BFF",
  cyan: "#27C7F5",
  success: "#22C78A",
  warning: "#F5B942",
  danger: "#F05D6C",
  muted: "#91A2BC",
  fg: "#F4F7FC",
  surface: "#111E35",
  grid: "rgba(148,169,204,0.09)",
};

export const TOOLTIP = {
  contentStyle: {
    background: "#0B1426",
    border: "1px solid rgba(148,169,204,0.2)",
    borderRadius: 12,
    boxShadow: "0 12px 30px -12px rgba(0,0,0,0.7)",
    padding: "8px 12px",
    fontSize: 12,
  },
  labelStyle: { color: "#91A2BC", marginBottom: 4 },
  itemStyle: { color: "#F4F7FC", padding: 0 },
};

export const SUMBU = {
  stroke: "#91A2BC",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;
