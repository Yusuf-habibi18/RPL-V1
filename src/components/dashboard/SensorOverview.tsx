import { Badge } from "@/components/ui/Badge";
import { MoistureGauge } from "@/components/viz/MoistureGauge";
import { RangeScale } from "@/components/viz/RangeScale";
import { SignalIndicator } from "@/components/viz/SignalIndicator";
import type { RingkasanLahan } from "@/lib/data/lahan";
import { statusKondisi } from "@/lib/data/lahan";
import { formatTanggalJam, waktuRelatif } from "@/lib/format";
import type { Parameter } from "@/types";

function ChipParam({ lahan, parameter }: { lahan: RingkasanLahan; parameter: Parameter }) {
  const p = lahan.pelanggaran.find((x) => x.parameter === parameter);
  if (!lahan.bacaan) return null;
  if (!p) return <Badge tone="success">Aman</Badge>;
  return (
    <Badge tone={p.tingkat === "BAHAYA" ? "danger" : "warning"}>
      Terlalu {p.arah === "RENDAH" ? "rendah" : "tinggi"}
    </Badge>
  );
}

/** Kondisi tanah saat ini: gauge kelembapan, skala pH & suhu, status koneksi sensor. */
export function SensorOverview({ lahan }: { lahan: RingkasanLahan }) {
  const b = lahan.bacaan;
  const ambang = (p: Parameter) => lahan.ambang.find((a) => a.parameter === p);
  const k = ambang("KELEMBAPAN_TANAH");
  const ph = ambang("PH");
  const suhu = ambang("SUHU");
  const statusKelembapan = b ? statusKondisi(lahan.pelanggaran.filter((x) => x.parameter === "KELEMBAPAN_TANAH")) : "TANPA_DATA";

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-line bg-bg/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Kelembapan tanah</p>
            <ChipParam lahan={lahan} parameter="KELEMBAPAN_TANAH" />
          </div>
          <div className="mt-2">
            <MoistureGauge nilai={b?.kelembapanTanah ?? null} min={k?.min} maks={k?.maks} status={statusKelembapan} />
          </div>
          {k && <p className="mt-1 text-center text-xs text-muted">Batas aman {k.min}–{k.maks}%</p>}
        </div>

        <div className="flex flex-col rounded-xl border border-line bg-bg/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">pH tanah</p>
            <ChipParam lahan={lahan} parameter="PH" />
          </div>
          <p className="mt-3 text-3xl font-bold num">{b ? b.ph.toLocaleString("id-ID", { maximumFractionDigits: 2 }) : "–"}</p>
          <div className="mt-auto pt-2">
            <RangeScale
              nilai={b?.ph ?? null}
              skalaMin={3}
              skalaMaks={10}
              amanMin={ph?.min}
              amanMaks={ph?.maks}
              jenis="ph"
              labelKiri="Asam"
              labelTengah="Netral"
              labelKanan="Basa"
              desimal={2}
            />
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-line bg-bg/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Suhu</p>
            <ChipParam lahan={lahan} parameter="SUHU" />
          </div>
          <p className="mt-3 text-3xl font-bold num">
            {b ? b.suhu.toLocaleString("id-ID") : "–"}
            <span className="ml-0.5 text-base font-semibold text-muted">°C</span>
          </p>
          <div className="mt-auto pt-2">
            <RangeScale
              nilai={b?.suhu ?? null}
              skalaMin={10}
              skalaMaks={45}
              amanMin={suhu?.min}
              amanMaks={suhu?.maks}
              satuan="°"
              jenis="suhu"
              labelKiri="Dingin"
              labelKanan="Panas"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {lahan.sensor.map((s) => (
            <SignalIndicator
              key={s.id}
              status={s.status}
              kode={s.kode}
              terakhir={s.terakhirAktif ? waktuRelatif(s.terakhirAktif) : "belum ada"}
              baterai={s.levelBaterai}
            />
          ))}
        </div>
        {b && (
          <p className="text-xs text-muted">
            Bacaan terakhir: <span className="text-fg num">{formatTanggalJam(b.waktuCatat)}</span>
          </p>
        )}
      </div>
    </div>
  );
}
