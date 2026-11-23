// Estimasi panen berbasis HST (FR-18). Sengaja tanpa import "@/..." agar bisa
// dipakai juga oleh prisma/seed.ts.

export interface Fase {
  nama: string;
  hstMulai: number;
  hstSelesai: number;
}

const MS_PER_HARI = 86_400_000;

/** Hari Setelah Tanam. Hanya tanggal kalender yang dihitung, jam diabaikan. */
export function hitungHst(tanggalTanam: Date, hariIni: Date = new Date()): number {
  const a = Date.UTC(tanggalTanam.getFullYear(), tanggalTanam.getMonth(), tanggalTanam.getDate());
  const b = Date.UTC(hariIni.getFullYear(), hariIni.getMonth(), hariIni.getDate());
  return Math.round((b - a) / MS_PER_HARI);
}

export function estimasiTanggalPanen(tanggalTanam: Date, umurPanenHst: number): Date {
  const d = new Date(tanggalTanam);
  d.setDate(d.getDate() + umurPanenHst);
  return d;
}

export function sisaHariMenujuPanen(tanggalTanam: Date, umurPanenHst: number, hariIni: Date = new Date()): number {
  return umurPanenHst - hitungHst(tanggalTanam, hariIni);
}

/** Fase tanam berdasarkan HST. Lewat fase terakhir → tetap fase terakhir; sebelum tanam → null. */
export function tentukanFase(hst: number, fase: Fase[]): string | null {
  if (hst < 0 || fase.length === 0) return null;
  const urut = [...fase].sort((x, y) => x.hstMulai - y.hstMulai);
  const cocok = urut.find((f) => hst >= f.hstMulai && hst <= f.hstSelesai);
  if (cocok) return cocok.nama;
  return hst > urut[urut.length - 1].hstSelesai ? urut[urut.length - 1].nama : null;
}
