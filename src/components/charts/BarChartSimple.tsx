"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SUMBU, TOOLTIP, WARNA } from "@/components/charts/tema";
import { formatBerat } from "@/lib/format";

/**
 * Grafik batang satu ukuran (satu sumbu-y). Warna per batang opsional lewat `warnaKey`
 * (mis. warna status lahan — selalu disertai label status di tooltip/teks).
 */
export function BarChartSimple<T extends Record<string, string | number>>({
  data,
  xKey,
  yKey,
  label,
  satuan = "",
  warna = WARNA.primary,
  warnaKey,
  horizontal = false,
  tinggi = 240,
  format,
  keteranganKey,
}: {
  data: T[];
  xKey: keyof T & string;
  yKey: keyof T & string;
  label: string;
  satuan?: string;
  warna?: string;
  warnaKey?: keyof T & string;
  horizontal?: boolean;
  tinggi?: number;
  /** "berat" → kg/ton. Berupa string (bukan fungsi) agar bisa dikirim dari Server Component. */
  format?: "angka" | "berat";
  /** Kolom teks tambahan untuk tooltip (mis. status). */
  keteranganKey?: keyof T & string;
}) {
  const fmt = (v: number) => (format === "berat" ? formatBerat(v) : `${v.toLocaleString("id-ID")}${satuan}`);
  const tip = (
    <Tooltip
      {...TOOLTIP}
      cursor={{ fill: "rgba(148,169,204,0.06)" }}
      formatter={(v, _n, item) => {
        const ket = keteranganKey ? ` · ${String((item?.payload as T)?.[keteranganKey] ?? "")}` : "";
        return [`${fmt(Number(v))}${ket}`, label];
      }}
    />
  );
  // Recharts 3 mengetik dataKey dari tipe data; baris dilonggarkan agar kunci string generik diterima.
  const baris = data as Record<string, string | number>[];
  const sel = warnaKey ? data.map((d, i) => <Cell key={i} fill={String(d[warnaKey])} />) : null;

  return (
    <div style={{ height: tinggi }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {horizontal ? (
          <BarChart data={baris} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barCategoryGap={6}>
            <CartesianGrid stroke={WARNA.grid} horizontal={false} />
            <XAxis type="number" {...SUMBU} tickFormatter={(v) => Number(v).toLocaleString("id-ID")} />
            <YAxis type="category" dataKey={xKey as string} width={110} {...SUMBU} tick={{ fill: WARNA.fg, fontSize: 12 }} />
            {tip}
            <Bar dataKey={yKey as string} name={label} fill={warna} radius={[0, 4, 4, 0]} maxBarSize={22} stroke={WARNA.surface} strokeWidth={2}>
              {sel}
            </Bar>
          </BarChart>
        ) : (
          <BarChart data={baris} margin={{ top: 8, right: 8, left: -4, bottom: 0 }} barCategoryGap="22%">
            <CartesianGrid stroke={WARNA.grid} vertical={false} />
            <XAxis dataKey={xKey as string} {...SUMBU} interval="preserveStartEnd" minTickGap={8} />
            <YAxis width={48} {...SUMBU} tickFormatter={(v) => Number(v).toLocaleString("id-ID", { notation: "compact" })} />
            {tip}
            <Bar dataKey={yKey as string} name={label} fill={warna} radius={[4, 4, 0, 0]} maxBarSize={36}>
              {sel}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
