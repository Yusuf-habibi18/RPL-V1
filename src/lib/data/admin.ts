import { prisma } from "@/lib/db";
import { statusSensor } from "@/lib/data/lahan";
import { waktuRelatif } from "@/lib/format";
import type { Peran, StatusSensor } from "@/types";

export interface BarisPengguna {
  id: string;
  nama: string;
  email: string;
  peran: Peran;
  noHp: string | null;
  wilayah: string | null;
  kelompokId: string | null;
  kelompok: string | null;
  aktif: boolean;
}

export interface BarisSensor {
  id: string;
  kode: string;
  lahanId: string;
  lahan: string;
  pemilik: string;
  status: StatusSensor;
  nonaktif: boolean;
  terakhirLabel: string;
  levelBaterai: number | null;
}

export interface BarisAmbang {
  id: string;
  komoditas: string;
  fase: string;
  parameter: string;
  min: number;
  maks: number;
}

export interface BarisAturan {
  id: string;
  komoditasId: string;
  komoditas: string;
  jenis: string;
  fase: string | null;
  parameter: string;
  operator: string;
  nilai: number;
  tindakan: string;
  dosis: string | null;
  sumber: string | null;
  aktif: boolean;
  dipakai: number;
}

/** Data halaman Administrasi (FR-02, FR-06, FR-11, FR-17). */
export async function dataAdmin() {
  const [pengguna, kelompok, sensor, lahan, komoditas, ambang, aturan] = await Promise.all([
    prisma.user.findMany({ include: { kelompok: { select: { nama: true } } }, orderBy: [{ peran: "asc" }, { nama: "asc" }] }),
    prisma.kelompokTani.findMany({ orderBy: { nama: "asc" } }),
    prisma.perangkatSensor.findMany({
      include: { lahan: { select: { id: true, nama: true, pemilik: { select: { nama: true } } } } },
      orderBy: { kode: "asc" },
    }),
    prisma.lahan.findMany({ select: { id: true, nama: true, pemilik: { select: { nama: true } } }, orderBy: { nama: "asc" } }),
    prisma.komoditas.findMany({ include: { fase: { orderBy: { urutan: "asc" } } }, orderBy: { nama: "asc" } }),
    prisma.ambangBatas.findMany({ include: { komoditas: { select: { nama: true } } } }),
    prisma.aturanRekomendasi.findMany({
      include: { komoditas: { select: { nama: true } }, _count: { select: { rekomendasi: true } } },
      orderBy: [{ jenis: "asc" }, { parameter: "asc" }, { nilai: "asc" }],
    }),
  ]);

  const sekarang = new Date();
  const urutanFase = new Map(komoditas.flatMap((k) => k.fase.map((f) => [`${k.id}:${f.nama}`, f.urutan] as const)));
  const urutanParam: Record<string, number> = { KELEMBAPAN_TANAH: 0, SUHU: 1, PH: 2 };

  return {
    pengguna: pengguna.map<BarisPengguna>((u) => ({
      id: u.id,
      nama: u.nama,
      email: u.email,
      peran: u.peran as Peran,
      noHp: u.noHp,
      wilayah: u.wilayah,
      kelompokId: u.kelompokId,
      kelompok: u.kelompok?.nama ?? null,
      aktif: u.aktif,
    })),
    sensor: sensor.map<BarisSensor>((s) => ({
      id: s.id,
      kode: s.kode,
      lahanId: s.lahan.id,
      lahan: s.lahan.nama,
      pemilik: s.lahan.pemilik.nama,
      status: statusSensor(s, sekarang),
      nonaktif: s.status === "NONAKTIF",
      terakhirLabel: s.terakhirAktif ? waktuRelatif(s.terakhirAktif, sekarang) : "Belum pernah",
      levelBaterai: s.levelBaterai,
    })),
    ambang: ambang
      .sort(
        (a, b) =>
          a.komoditas.nama.localeCompare(b.komoditas.nama) ||
          (urutanFase.get(`${a.komoditasId}:${a.fase}`) ?? 0) - (urutanFase.get(`${b.komoditasId}:${b.fase}`) ?? 0) ||
          (urutanParam[a.parameter] ?? 9) - (urutanParam[b.parameter] ?? 9),
      )
      .map<BarisAmbang>((a) => ({
        id: a.id,
        komoditas: a.komoditas.nama,
        fase: a.fase,
        parameter: a.parameter,
        min: a.min,
        maks: a.maks,
      })),
    aturan: aturan.map<BarisAturan>((a) => ({
      id: a.id,
      komoditasId: a.komoditasId,
      komoditas: a.komoditas.nama,
      jenis: a.jenis,
      fase: a.fase,
      parameter: a.parameter,
      operator: a.operator,
      nilai: a.nilai,
      tindakan: a.tindakan,
      dosis: a.dosis,
      sumber: a.sumber,
      aktif: a.aktif,
      dipakai: a._count.rekomendasi,
    })),
    opsiKelompok: kelompok.map((k) => ({ id: k.id, nama: k.desa ? `${k.nama} (${k.desa})` : k.nama })),
    opsiLahan: lahan.map((l) => ({ id: l.id, nama: `${l.nama} · ${l.pemilik.nama}` })),
    opsiKomoditas: komoditas.map((k) => ({ id: k.id, nama: k.nama, fase: k.fase.map((f) => f.nama) })),
  };
}
