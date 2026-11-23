import type { Ambang, BacaanSensor, IndikatorWarna, Parameter, TingkatPeringatan } from "@/types";
import { LABEL_PARAMETER, SATUAN_PARAMETER } from "@/types";
import { nilaiParameter } from "@/lib/validation";
import { formatAngka } from "@/lib/format";

export interface Pelanggaran {
  parameter: Parameter;
  nilai: number;
  min: number;
  maks: number;
  arah: "RENDAH" | "TINGGI";
  tingkat: TingkatPeringatan;
}

/**
 * Selisih dari batas (dalam persen lebar rentang aman) yang membuat peringatan
 * naik dari WASPADA ke BAHAYA. Contoh: rentang 60–80% → lebar 20; nilai 55 → selisih 5 = 25% → BAHAYA.
 */
export const BATAS_BAHAYA_PERSEN = 20;

/** FR-12: bandingkan bacaan sensor dengan ambang batas komoditas & fase. */
export function periksaAmbang(bacaan: BacaanSensor, ambang: Ambang[]): Pelanggaran[] {
  const nilai = nilaiParameter(bacaan);
  const hasil: Pelanggaran[] = [];

  for (const a of ambang) {
    const v = nilai[a.parameter];
    if (v >= a.min && v <= a.maks) continue;

    const arah = v < a.min ? "RENDAH" : "TINGGI";
    const selisih = arah === "RENDAH" ? a.min - v : v - a.maks;
    const lebar = Math.max(a.maks - a.min, Number.EPSILON);
    const tingkat: TingkatPeringatan =
      (selisih / lebar) * 100 > BATAS_BAHAYA_PERSEN ? "BAHAYA" : "WASPADA";

    hasil.push({ parameter: a.parameter, nilai: v, min: a.min, maks: a.maks, arah, tingkat });
  }
  return hasil;
}

/** Warna kartu status di dashboard (NFR-15). */
export function indikatorWarna(pelanggaran: Pelanggaran[]): IndikatorWarna {
  if (pelanggaran.some((p) => p.tingkat === "BAHAYA")) return "MERAH";
  if (pelanggaran.length > 0) return "KUNING";
  return "HIJAU";
}

/** Kalimat sederhana untuk notifikasi dan daftar peringatan. */
export function pesanPeringatan(p: Pelanggaran): string {
  const label = LABEL_PARAMETER[p.parameter];
  const satuan = SATUAN_PARAMETER[p.parameter];
  const arah = p.arah === "RENDAH" ? "terlalu rendah" : "terlalu tinggi";
  return `${label} ${arah} (${formatAngka(p.nilai, 2)}${satuan}). Batas aman ${formatAngka(p.min, 2)}–${formatAngka(p.maks, 2)}${satuan}.`;
}

/** NFR-13: sensor yang tidak mengirim data lebih dari 30 menit ditandai offline. */
export const BATAS_OFFLINE_MENIT = 30;

export function sensorOffline(terakhirAktif: Date | null, sekarang: Date = new Date()): boolean {
  if (!terakhirAktif) return true;
  return sekarang.getTime() - terakhirAktif.getTime() > BATAS_OFFLINE_MENIT * 60_000;
}
