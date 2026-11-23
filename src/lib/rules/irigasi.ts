import type { Ambang, BacaanSensor, DraftRekomendasi } from "@/types";
import { periksaAmbang } from "@/lib/rules/alert";
import { formatAngka } from "@/lib/format";

export interface InfoCuaca {
  /** Prakiraan curah hujan 24 jam ke depan (mm). */
  curahHujanMm24j: number;
}

/** Prakiraan hujan sebanyak ini dianggap cukup untuk menunda penyiraman. */
export const AMBANG_HUJAN_MM = 10;

/** Jam penyiraman yang dianjurkan (pagi & sore, menghindari terik siang). */
export const JAM_SIRAM = [6, 16] as const;

export function jadwalSiramBerikutnya(sekarang: Date): Date {
  for (const jam of JAM_SIRAM) {
    const d = new Date(sekarang);
    d.setHours(jam, 0, 0, 0);
    if (d > sekarang) return d;
  }
  const besok = new Date(sekarang);
  besok.setDate(besok.getDate() + 1);
  besok.setHours(JAM_SIRAM[0], 0, 0, 0);
  return besok;
}

/**
 * FR-15: rekomendasi penyiraman.
 * - Kelembapan dalam batas → tidak ada rekomendasi.
 * - Kering kritis (tingkat BAHAYA) → siram sekarang.
 * - Kering biasa + diprakirakan hujan → tunda.
 * - Kering biasa → siram pada jadwal pagi/sore berikutnya.
 */
export function rekomendasiPenyiraman(
  bacaan: BacaanSensor,
  ambangKelembapan: Omit<Ambang, "parameter">,
  cuaca: InfoCuaca | null,
  sekarang: Date = new Date(),
): DraftRekomendasi | null {
  const [p] = periksaAmbang(bacaan, [{ parameter: "KELEMBAPAN_TANAH", ...ambangKelembapan }]);
  if (!p || p.arah !== "RENDAH") return null;

  const kondisi = `Kelembapan tanah ${formatAngka(p.nilai)}% di bawah batas ${formatAngka(p.min)}%`;
  const hujan = cuaca?.curahHujanMm24j ?? 0;

  if (p.tingkat === "BAHAYA") {
    return {
      jenis: "SIRAM",
      jadwal: sekarang,
      tindakan: "Siram lahan sekarang",
      alasan: `${kondisi} (kritis).`,
      prioritas: "TINGGI",
    };
  }
  if (hujan >= AMBANG_HUJAN_MM) {
    return {
      jenis: "SIRAM",
      jadwal: jadwalSiramBerikutnya(sekarang),
      tindakan: "Tunda penyiraman, periksa lagi setelah hujan",
      alasan: `${kondisi}, tetapi diprakirakan hujan ${hujan} mm dalam 24 jam.`,
      prioritas: "RENDAH",
    };
  }
  return {
    jenis: "SIRAM",
    jadwal: jadwalSiramBerikutnya(sekarang),
    tindakan: "Siram lahan",
    alasan: `${kondisi}.`,
    prioritas: "SEDANG",
  };
}
