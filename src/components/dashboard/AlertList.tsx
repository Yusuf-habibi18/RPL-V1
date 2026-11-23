import { Bell, CircleCheck, Droplets, FlaskConical, Thermometer, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import type { ItemPeringatan } from "@/lib/data/peringatan";

const IKON = { KELEMBAPAN_TANAH: Droplets, PH: FlaskConical, SUHU: Thermometer, SENSOR_OFFLINE: WifiOff } as const;

/** Daftar peringatan dini (FR-14): ikon parameter, tingkat, pesan, lahan, waktu. */
export function AlertList({
  peringatan,
  tampilkanPemilik = false,
  kosong = "Tidak ada peringatan aktif. Semua lahan dalam batas aman.",
}: {
  peringatan: ItemPeringatan[];
  tampilkanPemilik?: boolean;
  kosong?: string;
}) {
  if (peringatan.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/5 p-4 text-sm">
        <CircleCheck className="size-5 shrink-0 text-success" aria-hidden />
        <p className="text-fg/90">{kosong}</p>
      </div>
    );
  }
  return (
    <ul className="space-y-2.5">
      {peringatan.map((p) => {
        const Ikon = IKON[p.parameter as keyof typeof IKON] ?? Bell;
        const bahaya = p.tingkat === "BAHAYA";
        const offline = p.parameter === "SENSOR_OFFLINE";
        return (
          <li
            key={p.id}
            className={cn(
              "relative flex gap-3 overflow-hidden rounded-xl border p-3.5",
              bahaya ? "border-danger/35 bg-danger/[0.07]" : "border-warning/30 bg-warning/[0.05]",
            )}
          >
            <span className={cn("absolute inset-y-0 left-0 w-1", bahaya ? "bg-danger" : "bg-warning")} aria-hidden />
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-lg",
                bahaya ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning",
              )}
            >
              <Ikon className="size-[18px]" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={bahaya ? "danger" : "warning"}>{offline ? "Sensor terputus" : bahaya ? "Kritis" : "Waspada"}</Badge>
                <span className="text-xs text-muted">{p.waktuLabel}</span>
              </div>
              <p className="mt-1.5 text-sm leading-snug text-fg">{p.pesan}</p>
              <p className="mt-1 text-xs text-muted">
                {p.lahan}
                {tampilkanPemilik && ` · ${p.pemilik}`}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
