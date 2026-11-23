import { prisma } from "@/lib/db";

export const RENTANG = {
  "24j": { label: "24 jam", jam: 24, emberMenit: 30 },
  "7h": { label: "7 hari", jam: 24 * 7, emberMenit: 120 },
  "30h": { label: "30 hari", jam: 24 * 30, emberMenit: 360 },
} as const;
export type KodeRentang = keyof typeof RENTANG;

export const keRentang = (v: string | undefined): KodeRentang =>
  v && v in RENTANG ? (v as KodeRentang) : "24j";

export interface TitikRiwayat {
  t: number; // epoch ms
  kelembapanTanah: number;
  suhu: number;
  ph: number;
}

export interface Statistik {
  min: number;
  rata: number;
  maks: number;
}

export interface RiwayatSensor {
  titik: TitikRiwayat[];
  jumlahBacaan: number;
  jumlahTidakValid: number;
  statistik: { kelembapanTanah: Statistik; suhu: Statistik; ph: Statistik } | null;
  terbaru: { waktuCatat: Date; kelembapanTanah: number; suhu: number; ph: number; valid: boolean; catatanValidasi: string | null }[];
}

const bulat = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

/**
 * Riwayat bacaan sensor (FR-10). Bacaan tidak valid (NFR-25) dihitung tetapi tidak digambar.
 * Bacaan dirata-rata per "ember" waktu agar grafik 7/30 hari tetap ringan.
 */
export async function ambilRiwayatSensor(
  lahanId: string,
  sensorId: string | null,
  rentang: KodeRentang,
): Promise<RiwayatSensor> {
  const { jam, emberMenit } = RENTANG[rentang];
  const sejak = new Date(Date.now() - jam * 3_600_000);
  const rows = await prisma.kondisiLahan.findMany({
    where: { lahanId, ...(sensorId ? { sensorId } : {}), waktuCatat: { gte: sejak } },
    orderBy: { waktuCatat: "asc" },
    select: { waktuCatat: true, kelembapanTanah: true, suhu: true, ph: true, valid: true, catatanValidasi: true },
  });

  const valid = rows.filter((r) => r.valid);
  const emberMs = emberMenit * 60_000;
  const ember = new Map<number, { n: number; k: number; s: number; p: number }>();
  for (const r of valid) {
    const kunci = Math.floor(r.waktuCatat.getTime() / emberMs) * emberMs;
    const e = ember.get(kunci) ?? { n: 0, k: 0, s: 0, p: 0 };
    e.n++;
    e.k += r.kelembapanTanah;
    e.s += r.suhu;
    e.p += r.ph;
    ember.set(kunci, e);
  }
  const titik = [...ember.entries()]
    .sort(([a], [b]) => a - b)
    .map(([t, e]) => ({ t, kelembapanTanah: bulat(e.k / e.n), suhu: bulat(e.s / e.n), ph: bulat(e.p / e.n, 2) }));

  const stat = (ambil: (r: (typeof valid)[number]) => number, d = 1): Statistik => {
    const v = valid.map(ambil);
    return { min: bulat(Math.min(...v), d), rata: bulat(v.reduce((a, b) => a + b, 0) / v.length, d), maks: bulat(Math.max(...v), d) };
  };

  return {
    titik,
    jumlahBacaan: rows.length,
    jumlahTidakValid: rows.length - valid.length,
    statistik: valid.length
      ? { kelembapanTanah: stat((r) => r.kelembapanTanah), suhu: stat((r) => r.suhu), ph: stat((r) => r.ph, 2) }
      : null,
    terbaru: rows.slice(-8).reverse(),
  };
}
