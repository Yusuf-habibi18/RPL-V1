import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hitungHst, tentukanFase, type Fase } from "@/lib/rules/estimasi-panen";
import { formatTanggal, formatTanggalJam } from "@/lib/format";
import { ZONA_WAKTU } from "@/lib/format";

const HARI_MS = 86_400_000;

export interface MusimSelesai {
  id: string;
  lahanId: string;
  lahan: string;
  desa: string | null;
  kelompok: string | null;
  varietas: string;
  tanggalTanam: Date;
  tanggalEstimasi: Date | null;
  tanggalPanen: Date;
  hasilKg: number;
  luasHa: number;
  produktivitasKgHa: number;
  /** Realisasi dikurangi estimasi (hari). Positif = panen lebih lambat dari estimasi. */
  selisihHari: number | null;
}

export async function ambilRealisasi(
  lingkup: Prisma.LahanWhereInput,
  filter: { dari?: Date; sampai?: Date; varietasId?: string } = {},
): Promise<MusimSelesai[]> {
  const rows = await prisma.realisasiPanen.findMany({
    where: {
      tanggalPanen: { gte: filter.dari, lte: filter.sampai },
      dataTanam: { lahan: lingkup, ...(filter.varietasId ? { varietasId: filter.varietasId } : {}) },
    },
    include: {
      dataTanam: {
        include: {
          lahan: { include: { pemilik: { select: { kelompok: { select: { nama: true, desa: true } } } } } },
          varietas: true,
          estimasi: true,
        },
      },
    },
    orderBy: { tanggalPanen: "asc" },
  });

  return rows.map((r) => {
    const t = r.dataTanam;
    const luasHa = t.luasTanamHa ?? t.lahan.luasHa;
    const est = t.estimasi?.tanggalEstimasi ?? null;
    return {
      id: r.id,
      lahanId: t.lahan.id,
      lahan: t.lahan.nama,
      desa: t.lahan.pemilik.kelompok?.desa ?? null,
      kelompok: t.lahan.pemilik.kelompok?.nama ?? null,
      varietas: t.varietas.nama,
      tanggalTanam: t.tanggalTanam,
      tanggalEstimasi: est,
      tanggalPanen: r.tanggalPanen,
      hasilKg: r.hasilKg,
      luasHa,
      produktivitasKgHa: luasHa > 0 ? r.hasilKg / luasHa : 0,
      selisihHari: est ? Math.round((r.tanggalPanen.getTime() - est.getTime()) / HARI_MS) : null,
    };
  });
}

/** Rata-rata produktivitas tertimbang luas (kg/ha). */
export function rataProduktivitas(musim: MusimSelesai[]): number {
  const luas = musim.reduce((n, m) => n + m.luasHa, 0);
  return luas > 0 ? musim.reduce((n, m) => n + m.hasilKg, 0) / luas : 0;
}

const kunciBulan = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_WAKTU, year: "numeric", month: "2-digit" }).format(d);
const labelBulan = (d: Date) => d.toLocaleDateString("id-ID", { timeZone: ZONA_WAKTU, month: "short", year: "2-digit" });

/** Total produksi per bulan dari `dari` sampai `sampai` (bulan tanpa panen bernilai 0, maks. 24 bulan). */
export function produksiPerBulan(musim: MusimSelesai[], dari: Date, sampai: Date) {
  const hasil: { bulan: string; hasilKg: number; luasHa: number }[] = [];
  const indeks = new Map<string, number>();
  const d = new Date(dari.getFullYear(), dari.getMonth(), 15);
  while (d <= sampai && hasil.length < 24) {
    indeks.set(kunciBulan(d), hasil.length);
    hasil.push({ bulan: labelBulan(d), hasilKg: 0, luasHa: 0 });
    d.setMonth(d.getMonth() + 1);
  }
  for (const m of musim) {
    const i = indeks.get(kunciBulan(m.tanggalPanen));
    if (i === undefined) continue;
    hasil[i].hasilKg += m.hasilKg;
    hasil[i].luasHa += m.luasHa;
  }
  return hasil.map((h) => ({ ...h, hasilKg: Math.round(h.hasilKg), luasHa: Math.round(h.luasHa * 100) / 100 }));
}

// ─────────────────────────── Halaman Tanam & Panen (petani) ───────────────────────────

export interface BarisTanam {
  id: string;
  lahanId: string;
  lahan: string;
  komoditas: string;
  varietas: string;
  tanggalTanam: Date;
  tanggalTanamLabel: string;
  luasTanamHa: number;
  hst: number;
  fase: string;
  fases: Fase[];
  umurPanenHst: number;
  estimasiLabel: string | null;
  sisaHari: number | null;
  status: "AKTIF" | "SELESAI";
  realisasi: { tanggalLabel: string; hasilKg: number } | null;
  bisaCatatPanen: boolean;
  kegiatan: { id: string; jenis: string; tanggalLabel: string; keterangan: string | null; jumlah: string | null }[];
}

/** Panen boleh dicatat mulai 10 hari sebelum umur panen. */
export const HARI_SEBELUM_PANEN_BOLEH_CATAT = 10;

export async function ambilDataTanamPetani(pemilikId: string) {
  const [tanam, lahan, varietas] = await Promise.all([
    prisma.dataTanam.findMany({
      where: { lahan: { pemilikId } },
      include: {
        lahan: true,
        varietas: { include: { komoditas: { include: { fase: true } } } },
        estimasi: true,
        realisasi: true,
        kegiatan: { orderBy: { tanggal: "desc" }, take: 8 },
      },
      orderBy: { tanggalTanam: "desc" },
    }),
    prisma.lahan.findMany({
      where: { pemilikId },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, luasHa: true, dataTanam: { where: { status: "AKTIF" }, select: { id: true } } },
    }),
    prisma.varietas.findMany({ include: { komoditas: true }, orderBy: { nama: "asc" } }),
  ]);

  const sekarang = new Date();
  const baris: BarisTanam[] = tanam.map((t) => {
    const fases = t.varietas.komoditas.fase
      .map((f) => ({ nama: f.nama, hstMulai: f.hstMulai, hstSelesai: f.hstSelesai }))
      .sort((a, b) => a.hstMulai - b.hstMulai);
    const selesai = t.status === "SELESAI";
    const hst = hitungHst(t.tanggalTanam, selesai && t.realisasi ? t.realisasi.tanggalPanen : sekarang);
    const est = t.estimasi?.tanggalEstimasi ?? null;
    return {
      id: t.id,
      lahanId: t.lahanId,
      lahan: t.lahan.nama,
      komoditas: t.varietas.komoditas.nama,
      varietas: t.varietas.nama,
      tanggalTanam: t.tanggalTanam,
      tanggalTanamLabel: formatTanggal(t.tanggalTanam),
      luasTanamHa: t.luasTanamHa ?? t.lahan.luasHa,
      hst,
      fase: selesai ? "PANEN" : (tentukanFase(hst, fases) ?? t.fase),
      fases,
      umurPanenHst: t.varietas.umurPanenHst,
      estimasiLabel: est ? formatTanggal(est, "long") : null,
      sisaHari: est && !selesai ? Math.ceil((est.getTime() - sekarang.getTime()) / HARI_MS) : null,
      status: selesai ? "SELESAI" : "AKTIF",
      realisasi: t.realisasi
        ? { tanggalLabel: formatTanggal(t.realisasi.tanggalPanen), hasilKg: t.realisasi.hasilKg }
        : null,
      bisaCatatPanen: !selesai && hst >= t.varietas.umurPanenHst - HARI_SEBELUM_PANEN_BOLEH_CATAT,
      kegiatan: t.kegiatan.map((k) => ({
        id: k.id,
        jenis: k.jenis,
        tanggalLabel: formatTanggalJam(k.tanggal),
        keterangan: k.keterangan,
        jumlah: k.jumlah,
      })),
    };
  });

  return {
    baris,
    opsiLahan: lahan.map((l) => ({ id: l.id, nama: l.nama, luasHa: l.luasHa, adaTanamAktif: l.dataTanam.length > 0 })),
    opsiVarietas: varietas.map((v) => ({
      id: v.id,
      nama: `${v.komoditas.nama} · ${v.nama}`,
      umurPanenHst: v.umurPanenHst,
    })),
  };
}
