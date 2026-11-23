import { belumTersedia } from "@/lib/http";

/** GET /api/alert?lahanId=&status= — riwayat peringatan dan statusnya (FR-14). */
export async function GET() {
  return belumTersedia(["FR-14"], 3);
}

/** PATCH /api/alert — ubah status peringatan (AKTIF → DITANGANI → SELESAI). */
export async function PATCH() {
  return belumTersedia(["FR-14"], 3);
}
