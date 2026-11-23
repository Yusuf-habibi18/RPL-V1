import { belumTersedia } from "@/lib/http";

/**
 * GET /api/laporan?jenis=produksi|luas-tanam|panen-kelompok&periode=2026-11&format=pdf|xlsx
 * Agregasi DataTanam, EstimasiPanen, dan RealisasiPanen sesuai cakupan role (FR-21, FR-22, FR-23).
 */
export async function GET() {
  return belumTersedia(["FR-22", "FR-23"], 5);
}
