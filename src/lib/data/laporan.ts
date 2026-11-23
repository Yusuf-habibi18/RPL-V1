import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { PenggunaAktif } from "@/lib/current-user";
import { lingkupLahan } from "@/lib/data/lahan";
import { ambilRealisasi, produksiPerBulan, rataProduktivitas } from "@/lib/data/panen";

export interface FilterLaporan {
  dari: Date;
  sampai: Date;
  dariStr: string;
  sampaiStr: string;
  lahanId?: string;
  varietasId?: string;
}

const TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
const keIso = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);

/** Baca filter dari query string; default 180 hari terakhir. */
export function bacaFilterLaporan(sp: Record<string, string | string[] | undefined>): FilterLaporan {
  const ambil = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const sampaiStr = TANGGAL.test(ambil("sampai") ?? "") ? ambil("sampai")! : keIso(new Date());
  const dariStr = TANGGAL.test(ambil("dari") ?? "")
    ? ambil("dari")!
    : keIso(new Date(Date.now() - 180 * 86_400_000));
  let dari = new Date(`${dariStr}T00:00:00+07:00`);
  let sampai = new Date(`${sampaiStr}T23:59:59+07:00`);
  if (dari > sampai) [dari, sampai] = [new Date(`${sampaiStr}T00:00:00+07:00`), new Date(`${dariStr}T23:59:59+07:00`)];
  return { dari, sampai, dariStr, sampaiStr, lahanId: ambil("lahan") || undefined, varietasId: ambil("varietas") || undefined };
}

const bulat = (n: number | null | undefined, d = 1) => (n == null ? null : Math.round(n * 10 ** d) / 10 ** d);

/** Data laporan sesuai cakupan role (FR-21, FR-22). */
export async function dataLaporan(user: PenggunaAktif, f: FilterLaporan) {
  const dasar = lingkupLahan(user);
  const lingkup: Prisma.LahanWhereInput = f.lahanId ? { AND: [dasar, { id: f.lahanId }] } : dasar;
  const periode = { gte: f.dari, lte: f.sampai };

  const [lahan, opsiLahan, opsiVarietas, sensorGrup, peringatanGrup, musim, tanamBaru] = await Promise.all([
    prisma.lahan.findMany({
      where: lingkup,
      select: { id: true, nama: true, luasHa: true, pemilik: { select: { nama: true } } },
      orderBy: { nama: "asc" },
    }),
    prisma.lahan.findMany({ where: dasar, select: { id: true, nama: true }, orderBy: { nama: "asc" } }),
    prisma.varietas.findMany({ include: { komoditas: true }, orderBy: { nama: "asc" } }),
    prisma.kondisiLahan.groupBy({
      by: ["lahanId", "valid"],
      where: { lahan: lingkup, waktuCatat: periode },
      _avg: { kelembapanTanah: true, suhu: true, ph: true },
      _count: { _all: true },
    }),
    prisma.peringatanDini.groupBy({
      by: ["lahanId", "tingkat"],
      where: { lahan: lingkup, createdAt: periode },
      _count: { _all: true },
    }),
    ambilRealisasi(lingkup, { dari: f.dari, sampai: f.sampai, varietasId: f.varietasId }),
    prisma.dataTanam.findMany({
      where: { lahan: lingkup, tanggalTanam: periode, ...(f.varietasId ? { varietasId: f.varietasId } : {}) },
      select: { luasTanamHa: true, lahan: { select: { luasHa: true } } },
    }),
  ]);

  const kondisiSensor = lahan.map((l) => {
    const valid = sensorGrup.find((g) => g.lahanId === l.id && g.valid);
    const tidakValid = sensorGrup.find((g) => g.lahanId === l.id && !g.valid);
    const total = (valid?._count._all ?? 0) + (tidakValid?._count._all ?? 0);
    const hitung = (tingkat: string) =>
      peringatanGrup.find((g) => g.lahanId === l.id && g.tingkat === tingkat)?._count._all ?? 0;
    return {
      lahanId: l.id,
      lahan: l.nama,
      pemilik: l.pemilik.nama,
      bacaan: total,
      validPersen: total ? Math.round(((valid?._count._all ?? 0) / total) * 1000) / 10 : null,
      kelembapan: bulat(valid?._avg.kelembapanTanah),
      suhu: bulat(valid?._avg.suhu),
      ph: bulat(valid?._avg.ph, 2),
      waspada: hitung("WASPADA"),
      bahaya: hitung("BAHAYA"),
    };
  });

  return {
    kondisiSensor,
    musim,
    produksiTotal: musim.reduce((n, m) => n + m.hasilKg, 0),
    produktivitas: rataProduktivitas(musim),
    produksiBulanan: produksiPerBulan(musim, f.dari, f.sampai),
    jumlahLahan: lahan.length,
    luasLahan: lahan.reduce((n, l) => n + l.luasHa, 0),
    tanamBaru: tanamBaru.length,
    luasTanamBaru: tanamBaru.reduce((n, t) => n + (t.luasTanamHa ?? t.lahan.luasHa), 0),
    totalPeringatan: peringatanGrup.reduce((n, g) => n + g._count._all, 0),
    opsiLahan,
    opsiVarietas: opsiVarietas.map((v) => ({ id: v.id, nama: `${v.komoditas.nama} · ${v.nama}` })),
  };
}
