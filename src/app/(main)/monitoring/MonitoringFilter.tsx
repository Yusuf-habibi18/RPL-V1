"use client";

import { RefreshCw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

/** Pemilih lahan, sensor, dan rentang waktu. State disimpan di URL agar bisa dibagikan. */
export function MonitoringFilter({
  lahan,
  sensor,
  lahanId,
  sensorId,
  rentang,
}: {
  lahan: { id: string; label: string }[];
  sensor: { id: string; kode: string }[];
  lahanId: string;
  sensorId: string | null;
  rentang: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, mulai] = useTransition();

  const ganti = (ubah: Record<string, string | null>) => {
    const q = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(ubah)) (v ? q.set(k, v) : q.delete(k));
    mulai(() => router.push(`${pathname}?${q.toString()}`, { scroll: false }));
  };

  return (
    <div className={cn("panel flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-end", pending && "opacity-70")}>
      <label className="flex-1 space-y-1">
        <span className="text-xs font-semibold text-muted">Lahan</span>
        <Select value={lahanId} onChange={(e) => ganti({ lahan: e.target.value, sensor: null })} aria-label="Pilih lahan">
          {lahan.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </Select>
      </label>
      <label className="space-y-1 sm:w-48">
        <span className="text-xs font-semibold text-muted">Sensor</span>
        <Select value={sensorId ?? ""} onChange={(e) => ganti({ sensor: e.target.value || null })} aria-label="Pilih sensor">
          <option value="">Semua sensor</option>
          {sensor.map((s) => (
            <option key={s.id} value={s.id}>
              {s.kode}
            </option>
          ))}
        </Select>
      </label>
      <div className="space-y-1">
        <span className="text-xs font-semibold text-muted">Rentang waktu</span>
        <div className="flex gap-1 rounded-xl bg-bg/60 p-1" role="group" aria-label="Rentang waktu">
          {[
            ["24j", "24 jam"],
            ["7h", "7 hari"],
            ["30h", "30 hari"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => ganti({ rentang: k })}
              aria-pressed={rentang === k}
              className={cn(
                "h-9 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors sm:flex-none",
                rentang === k ? "bg-primary text-white" : "text-muted hover:text-fg",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <Button variant="secondary" onClick={() => mulai(() => router.refresh())} loading={pending} aria-label="Muat ulang data">
        {!pending && <RefreshCw />} <span className="sm:hidden lg:inline">Muat ulang</span>
      </Button>
    </div>
  );
}
