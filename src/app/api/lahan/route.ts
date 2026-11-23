import { belumTersedia } from "@/lib/http";

/** GET /api/lahan — daftar lahan milik pengguna yang login (FR-03, NFR-06). */
export async function GET() {
  return belumTersedia(["FR-03"], 1);
}

/** POST /api/lahan — tambah lahan: nama, luasHa, lokasi, jenisTanah (FR-03). */
export async function POST() {
  return belumTersedia(["FR-03"], 1);
}
