import { cn } from "@/lib/cn";

const GRADIEN = {
  ph: "linear-gradient(90deg,#F05D6C 0%,#F5B942 28%,#22C78A 48%,#27C7F5 70%,#247BFF 100%)",
  suhu: "linear-gradient(90deg,#247BFF 0%,#27C7F5 25%,#22C78A 45%,#F5B942 72%,#F05D6C 100%)",
} as const;

/**
 * Skala horizontal dengan pita rentang aman dan penanda nilai saat ini.
 * Dipakai untuk pH tanah (0–14, asam–basa) dan suhu.
 */
export function RangeScale({
  nilai,
  skalaMin,
  skalaMaks,
  amanMin,
  amanMaks,
  satuan = "",
  jenis,
  labelKiri,
  labelTengah,
  labelKanan,
  desimal = 1,
}: {
  nilai: number | null;
  skalaMin: number;
  skalaMaks: number;
  amanMin?: number;
  amanMaks?: number;
  satuan?: string;
  jenis: keyof typeof GRADIEN;
  labelKiri: string;
  labelTengah?: string;
  labelKanan: string;
  desimal?: number;
}) {
  const persen = (v: number) => Math.min(100, Math.max(0, ((v - skalaMin) / (skalaMaks - skalaMin)) * 100));
  const diLuar = nilai !== null && amanMin !== undefined && amanMaks !== undefined && (nilai < amanMin || nilai > amanMaks);

  return (
    <div className="w-full">
      <div className="relative pt-9">
        {nilai !== null && (
          <div className="absolute top-0 -translate-x-1/2 transition-[left] duration-500" style={{ left: `${persen(nilai)}%` }}>
            <span
              className={cn(
                "block whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-bold num",
                diLuar ? "bg-warning text-bg" : "bg-fg text-bg",
              )}
            >
              {nilai.toLocaleString("id-ID", { maximumFractionDigits: desimal })}
              {satuan}
            </span>
            <span className={cn("mx-auto block size-0 border-x-4 border-t-[5px] border-x-transparent", diLuar ? "border-t-warning" : "border-t-fg")} />
          </div>
        )}
        <div className="relative h-2.5 rounded-full opacity-90" style={{ background: GRADIEN[jenis] }}>
          {amanMin !== undefined && amanMaks !== undefined && (
            <div
              className="absolute -inset-y-1.5 rounded-md border-2 border-success/80 bg-success/10"
              style={{ left: `${persen(amanMin)}%`, width: `${persen(amanMaks) - persen(amanMin)}%` }}
              title={`Rentang aman ${amanMin}–${amanMaks}${satuan}`}
            />
          )}
        </div>
      </div>
      <div className="mt-2.5 flex justify-between text-[11px] text-muted">
        <span>{labelKiri}</span>
        {labelTengah && <span>{labelTengah}</span>}
        <span>{labelKanan}</span>
      </div>
    </div>
  );
}
