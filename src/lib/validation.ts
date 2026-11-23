import { z } from "zod";
import type { BacaanSensor, Parameter } from "@/types";

/** Rentang fisik wajar sensor (NFR-25). Nilai di luar rentang ini dianggap data rusak. */
export const RENTANG_FISIK: Record<Parameter, { min: number; maks: number }> = {
  KELEMBAPAN_TANAH: { min: 0, maks: 100 },
  SUHU: { min: -10, maks: 60 },
  PH: { min: 0, maks: 14 },
};

export const bacaanSensorSchema = z.object({
  kodeSensor: z.string().min(1),
  waktuCatat: z.coerce.date(),
  kelembapanTanah: z.number(),
  suhu: z.number(),
  ph: z.number(),
  levelBaterai: z.number().int().min(0).max(100).optional(),
});
export type PayloadSensor = z.infer<typeof bacaanSensorSchema>;

/**
 * Sensor boleh mengirim satu bacaan, atau sekumpulan bacaan yang ditampung
 * selama koneksi putus lalu dikirim sekaligus saat sinyal pulih (NFR-11).
 */
export const payloadIngestSchema = z.union([
  bacaanSensorSchema,
  z.array(bacaanSensorSchema).min(1).max(500),
]);

export function nilaiParameter(b: BacaanSensor): Record<Parameter, number> {
  return { KELEMBAPAN_TANAH: b.kelembapanTanah, SUHU: b.suhu, PH: b.ph };
}

export interface HasilValidasi {
  valid: boolean;
  alasan: string[];
}

/** FR-08 / T-04: tandai bacaan yang di luar rentang fisik agar tidak dipakai rekomendasi. */
export function validasiRentangFisik(b: BacaanSensor): HasilValidasi {
  const nilai = nilaiParameter(b);
  const alasan: string[] = [];
  for (const parameter of Object.keys(RENTANG_FISIK) as Parameter[]) {
    const { min, maks } = RENTANG_FISIK[parameter];
    const v = nilai[parameter];
    if (!Number.isFinite(v) || v < min || v > maks) {
      alasan.push(`${parameter} = ${v} di luar rentang fisik ${min}–${maks}`);
    }
  }
  return { valid: alasan.length === 0, alasan };
}
