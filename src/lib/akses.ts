// Aturan hak akses halaman. Sengaja tanpa dependensi Node agar bisa dipakai di middleware (edge).
import type { Peran } from "@/types";

const SEMUA: Peran[] = ["PETANI", "KETUA_KELOMPOK", "DINAS", "ADMIN"];

/**
 * Hak akses halaman per role (FR-02, NFR-06).
 * Data di dalam halaman tetap disaring per pemilik/kelompok/wilayah (lib/data/lahan.ts → lingkupLahan).
 */
export const HAK_AKSES: Record<string, Peran[]> = {
  "/dashboard": SEMUA, // isi dashboard berbeda per role
  "/monitoring": ["PETANI", "KETUA_KELOMPOK", "ADMIN"],
  "/rekomendasi": ["PETANI"],
  "/tanam-panen": ["PETANI"],
  "/kelompok": ["KETUA_KELOMPOK"],
  "/laporan": SEMUA, // FR-23: semua pengguna bisa melihat & mengunduh laporan sesuai cakupannya
  "/admin": ["ADMIN"],
};

/** Halaman yang tidak terdaftar di HAK_AKSES boleh dibuka semua pengguna yang sudah login. */
export function bolehAkses(peran: Peran, pathname: string): boolean {
  const prefix = Object.keys(HAK_AKSES).find((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!prefix) return true;
  return HAK_AKSES[prefix].includes(peran);
}
