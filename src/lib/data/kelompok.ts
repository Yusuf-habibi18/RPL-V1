import { prisma } from "@/lib/db";
import type { PenggunaAktif } from "@/lib/current-user";
import { ambilRingkasanLahan, lingkupLahan, URUTAN_STATUS, type RingkasanLahan } from "@/lib/data/lahan";
import { ambilPeringatanAktif } from "@/lib/data/peringatan";
import { waktuRelatif } from "@/lib/format";
import type { StatusKondisi } from "@/types";

export interface AnggotaKelompok {
  id: string;
  nama: string;
  email: string;
  noHp: string | null;
  aktif: boolean;
  lahan: RingkasanLahan[];
  luasHa: number;
  statusTerburuk: StatusKondisi;
  aktivitasTerakhir: string | null;
}

/** Data kelompok tani untuk ketua (FR-20, FR-21). Hanya kelompok yang dipimpinnya. */
export async function ambilDataKelompok(user: PenggunaAktif) {
  const kelompok = user.memimpin;
  if (!kelompok) return null;
  const lingkup = lingkupLahan(user);

  const [lahan, peringatan, anggotaDb, kegiatan] = await Promise.all([
    ambilRingkasanLahan(lingkup),
    ambilPeringatanAktif(lingkup, 10),
    prisma.user.findMany({
      where: { kelompokId: kelompok.id, peran: "PETANI" },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, email: true, noHp: true, aktif: true },
    }),
    prisma.kegiatanBudidaya.findMany({
      where: { dataTanam: { lahan: lingkup } },
      include: { dicatatOleh: { select: { id: true, nama: true } }, dataTanam: { select: { lahan: { select: { nama: true } } } } },
      orderBy: { tanggal: "desc" },
      take: 40,
    }),
  ]);

  const sekarang = new Date();
  const anggota: AnggotaKelompok[] = anggotaDb.map((a) => {
    const milik = lahan.filter((l) => l.pemilik.id === a.id);
    const terakhir = kegiatan.find((k) => k.dicatatOleh.id === a.id);
    const statusTerburuk = milik.reduce<StatusKondisi>(
      (s, l) => (URUTAN_STATUS[l.status] < URUTAN_STATUS[s] ? l.status : s),
      "KOSONG",
    );
    return {
      ...a,
      lahan: milik,
      luasHa: milik.reduce((n, l) => n + l.luasHa, 0),
      statusTerburuk,
      aktivitasTerakhir: terakhir ? waktuRelatif(terakhir.tanggal, sekarang) : null,
    };
  });

  const jadwalPanen = lahan
    .filter((l) => l.tanam?.estimasiPanen)
    .map((l) => ({
      lahanId: l.id,
      lahan: l.nama,
      pemilik: l.pemilik.nama,
      varietas: l.tanam!.varietas,
      luasHa: l.tanam!.luasTanamHa,
      hst: l.tanam!.hst,
      umurPanenHst: l.tanam!.umurPanenHst,
      estimasi: l.tanam!.estimasiPanen!,
    }))
    .sort((a, b) => a.estimasi.getTime() - b.estimasi.getTime());

  return {
    kelompok,
    lahan,
    anggota,
    peringatan,
    jadwalPanen,
    kegiatan: kegiatan.slice(0, 10).map((k) => ({
      id: k.id,
      jenis: k.jenis,
      oleh: k.dicatatOleh.nama,
      lahan: k.dataTanam.lahan.nama,
      keterangan: k.keterangan,
      waktuLabel: waktuRelatif(k.tanggal, sekarang),
    })),
  };
}
