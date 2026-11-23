import { belumTersedia } from "@/lib/http";

/**
 * POST /api/sensor/ingest — menerima data sensor (FR-07, FR-08).
 *
 * Header : x-api-key: <API key sensor>
 * Body   : satu bacaan atau array bacaan (lihat payloadIngestSchema di lib/validation.ts)
 *
 * Langkah (Sprint 2):
 * 1. Cari PerangkatSensor berdasarkan kodeSensor, cocokkan SHA-256(x-api-key) dengan apiKeyHash → 401 bila salah (NFR-08).
 * 2. Parse body dengan payloadIngestSchema → 400 bila format salah.
 * 3. Tiap bacaan: validasiRentangFisik() → simpan KondisiLahan, valid=false bila di luar rentang (NFR-25, T-04).
 * 4. Upsert berdasarkan (sensorId, waktuCatat) agar sinkron ulang tidak menggandakan data (NFR-11, T-09).
 * 5. Perbarui terakhirAktif, levelBaterai, status=AKTIF pada PerangkatSensor.
 *
 * Langkah (Sprint 3):
 * 6. Bacaan valid → periksaAmbang() → buat PeringatanDini → kirimNotifikasi() (FR-12, FR-13, NFR-03 < 2 menit).
 */
export async function POST() {
  return belumTersedia(["FR-07", "FR-08"], 2);
}
