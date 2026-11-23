import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { PenggunaAktif } from "@/lib/current-user";
import { indikatorWarna, periksaAmbang, sensorOffline, type Pelanggaran } from "@/lib/rules/alert";
import { hitungHst, tentukanFase, type Fase } from "@/lib/rules/estimasi-panen";
import type { Ambang, Parameter, StatusKondisi, StatusSensor } from "@/types";

/**
 * Cakupan data lahan per role (NFR-06):
 * petani → lahannya sendiri, ketua → lahan anggota kelompoknya,
 * dinas → lahan di wilayahnya, admin → semua.
 */
export function lingkupLahan(user: PenggunaAktif): Prisma.LahanWhereInput {
  switch (user.peran) {
    case "PETANI":
      return { pemilikId: user.id };
    case "KETUA_KELOMPOK":
      return user.memimpin ? { pemilik: { kelompokId: user.memimpin.id } } : { id: "__tidak-ada__" };
    case "DINAS":
      // Dinas tanpa wilayah dianggap dinas tingkat kabupaten (melihat semua).
      return user.wilayah ? { pemilik: { kelompok: { wilayah: user.wilayah } } } : {};
    case "ADMIN":
      return {};
  }
}

export function statusSensor(s: { status: string; terakhirAktif: Date | null }, sekarang = new Date()): StatusSensor {
  if (s.status === "NONAKTIF") return "NONAKTIF";
  return sensorOffline(s.terakhirAktif, sekarang) ? "OFFLINE" : "AKTIF";
}

export function statusKondisi(pelanggaran: Pelanggaran[]): StatusKondisi {
  const w = indikatorWarna(pelanggaran);
  return w === "MERAH" ? "KRITIS" : w === "KUNING" ? "WASPADA" : "SEHAT";
}

/** Urutan prioritas tampilan: yang paling butuh perhatian lebih dulu. */
export const URUTAN_STATUS: Record<StatusKondisi, number> = {
  KRITIS: 0,
  WASPADA: 1,
  TANPA_DATA: 2,
  SEHAT: 3,
  KOSONG: 4,
};

export interface TanamAktif {
  id: string;
  komoditas: string;
  komoditasId: string;
  varietas: string;
  tanggalTanam: Date;
  hst: number;
  fase: string;
  umurPanenHst: number;
  estimasiPanen: Date | null;
  luasTanamHa: number;
  fases: Fase[];
}

export interface BacaanTerakhir {
  id: string;
  kelembapanTanah: number;
  suhu: number;
  ph: number;
  waktuCatat: Date;
}

export interface RingkasanLahan {
  id: string;
  nama: string;
  luasHa: number;
  jenisTanah: string | null;
  kodeWilayah: string | null;
  pemilik: { id: string; nama: string };
  kelompok: string | null;
  desa: string | null;
  sensor: { id: string; kode: string; status: StatusSensor; terakhirAktif: Date | null; levelBaterai: number | null }[];
  bacaan: BacaanTerakhir | null;
  tanam: TanamAktif | null;
  ambang: Ambang[];
  pelanggaran: Pelanggaran[];
  status: StatusKondisi;
  adaSensorOffline: boolean;
}

export async function ambilRingkasanLahan(where: Prisma.LahanWhereInput): Promise<RingkasanLahan[]> {
  const daftar = await prisma.lahan.findMany({
    where,
    orderBy: { nama: "asc" },
    include: {
      pemilik: { select: { id: true, nama: true, kelompok: { select: { nama: true, desa: true } } } },
      sensor: { orderBy: { kode: "asc" } },
      kondisi: { where: { valid: true }, orderBy: { waktuCatat: "desc" }, take: 1 },
      dataTanam: {
        where: { status: "AKTIF" },
        orderBy: { tanggalTanam: "desc" },
        take: 1,
        include: { varietas: { include: { komoditas: { include: { fase: true } } } }, estimasi: true },
      },
    },
  });

  const komoditasIds = [...new Set(daftar.flatMap((l) => l.dataTanam.map((t) => t.varietas.komoditasId)))];
  const semuaAmbang = komoditasIds.length
    ? await prisma.ambangBatas.findMany({ where: { komoditasId: { in: komoditasIds } } })
    : [];
  const sekarang = new Date();

  return daftar.map((l) => {
    const t = l.dataTanam[0];
    const tanam: TanamAktif | null = t ? buatTanamAktif(t, l.luasHa, sekarang) : null;
    const ambang: Ambang[] = tanam
      ? semuaAmbang
          .filter((a) => a.komoditasId === tanam.komoditasId && a.fase === tanam.fase)
          .map((a) => ({ parameter: a.parameter as Parameter, min: a.min, maks: a.maks }))
      : [];

    const k = l.kondisi[0];
    const bacaan: BacaanTerakhir | null = k
      ? { id: k.id, kelembapanTanah: k.kelembapanTanah, suhu: k.suhu, ph: k.ph, waktuCatat: k.waktuCatat }
      : null;
    const pelanggaran = bacaan ? periksaAmbang(bacaan, ambang) : [];
    const status: StatusKondisi = !tanam ? "KOSONG" : !bacaan ? "TANPA_DATA" : statusKondisi(pelanggaran);
    const sensor = l.sensor.map((s) => ({
      id: s.id,
      kode: s.kode,
      status: statusSensor(s, sekarang),
      terakhirAktif: s.terakhirAktif,
      levelBaterai: s.levelBaterai,
    }));

    return {
      id: l.id,
      nama: l.nama,
      luasHa: l.luasHa,
      jenisTanah: l.jenisTanah,
      kodeWilayah: l.kodeWilayah,
      pemilik: { id: l.pemilik.id, nama: l.pemilik.nama },
      kelompok: l.pemilik.kelompok?.nama ?? null,
      desa: l.pemilik.kelompok?.desa ?? null,
      sensor,
      bacaan,
      tanam,
      ambang,
      pelanggaran,
      status,
      adaSensorOffline: sensor.some((s) => s.status === "OFFLINE"),
    };
  });
}

type DataTanamDenganRelasi = Prisma.DataTanamGetPayload<{
  include: { varietas: { include: { komoditas: { include: { fase: true } } } }; estimasi: true };
}>;

function buatTanamAktif(t: DataTanamDenganRelasi, luasLahan: number, sekarang: Date): TanamAktif {
  const fases = t.varietas.komoditas.fase
    .map((f) => ({ nama: f.nama, hstMulai: f.hstMulai, hstSelesai: f.hstSelesai }))
    .sort((a, b) => a.hstMulai - b.hstMulai);
  const hst = hitungHst(t.tanggalTanam, sekarang);
  return {
    id: t.id,
    komoditas: t.varietas.komoditas.nama,
    komoditasId: t.varietas.komoditasId,
    varietas: t.varietas.nama,
    tanggalTanam: t.tanggalTanam,
    hst,
    // Fase dihitung ulang dari HST agar selalu terkini.
    fase: tentukanFase(hst, fases) ?? t.fase,
    umurPanenHst: t.varietas.umurPanenHst,
    estimasiPanen: t.estimasi?.tanggalEstimasi ?? null,
    luasTanamHa: t.luasTanamHa ?? luasLahan,
    fases,
  };
}

/** Lahan yang paling butuh perhatian lebih dulu. */
export function urutkanMenurutStatus<T extends { status: StatusKondisi }>(daftar: T[]): T[] {
  return [...daftar].sort((a, b) => URUTAN_STATUS[a.status] - URUTAN_STATUS[b.status]);
}

export function hitungStatus(daftar: { status: StatusKondisi }[]) {
  const hasil: Record<StatusKondisi, number> = { SEHAT: 0, WASPADA: 0, KRITIS: 0, TANPA_DATA: 0, KOSONG: 0 };
  for (const l of daftar) hasil[l.status]++;
  return hasil;
}
