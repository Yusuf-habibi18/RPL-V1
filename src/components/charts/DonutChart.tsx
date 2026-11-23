"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { KATEGORI, TOOLTIP, WARNA } from "@/components/charts/tema";

/**
 * Donat komposisi (maks. 4 kategori, warna urutan tetap). Legenda dengan nilai & persen
 * selalu tampil sehingga identitas tidak hanya lewat warna.
 */
export function DonutChart({
  data,
  satuan = "",
  labelTengah,
}: {
  data: { label: string; nilai: number }[];
  satuan?: string;
  labelTengah: string;
}) {
  const total = data.reduce((n, d) => n + d.nilai, 0);
  const isi = data.slice(0, KATEGORI.length);

  if (total === 0) return <p className="py-10 text-center text-sm text-muted">Belum ada data.</p>;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative size-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={isi}
              dataKey="nilai"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              stroke={WARNA.surface}
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
            >
              {isi.map((_, i) => (
                <Cell key={i} fill={KATEGORI[i]} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP} formatter={(v, n) => [`${Number(v).toLocaleString("id-ID")}${satuan}`, String(n)]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xl font-bold num">{total.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-muted">{labelTengah}</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {isi.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: KATEGORI[i] }} aria-hidden />
            <span className="flex-1 truncate text-fg/90">{d.label}</span>
            <span className="font-semibold num">
              {d.nilai.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
              {satuan}
            </span>
            <span className="w-11 text-right text-xs text-muted num">{Math.round((d.nilai / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
