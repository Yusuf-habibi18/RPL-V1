import Link from "next/link";
import { WARNA_STATUS, STATUS_KONDISI } from "@/components/ui/status";
import { cn } from "@/lib/cn";
import type { StatusKondisi } from "@/types";

/** Pemilih lahan berupa chip; status ditulis sebagai teks (bukan hanya warna). */
export function LandSwitcher({
  lahan,
  aktif,
  basePath,
  param = "lahan",
}: {
  lahan: { id: string; nama: string; status: StatusKondisi }[];
  aktif: string;
  basePath: string;
  param?: string;
}) {
  return (
    <nav aria-label="Pilih lahan" className="flex flex-wrap gap-2">
      {lahan.map((l) => {
        const on = l.id === aktif;
        return (
          <Link
            key={l.id}
            href={`${basePath}?${param}=${l.id}`}
            aria-current={on ? "true" : undefined}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition-colors",
              on ? "border-primary/50 bg-primary/15 text-fg" : "border-line bg-bg/40 text-muted hover:border-primary/30 hover:text-fg",
            )}
          >
            <span className="size-2 rounded-full" style={{ background: WARNA_STATUS[l.status] }} aria-hidden />
            {l.nama}
            <span className="sr-only">({STATUS_KONDISI[l.status].label})</span>
          </Link>
        );
      })}
    </nav>
  );
}
