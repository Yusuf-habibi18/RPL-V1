import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatJam, formatTanggalJam, formatTanggalPendek, waktuRelatif } from "@/lib/format";
import type { JenisRekomendasi, Prioritas, StatusRekomendasi } from "@/types";

export interface ItemRekomendasi {
  id: string;
  jenis: JenisRekomendasi;
  tindakan: string;
  alasan: string;
  dosis: string | null;
  prioritas: Prioritas;
  status: StatusRekomendasi;
  jadwalLabel: string;
  dibuatLabel: string;
  lahanId: string;
  lahan: string;
  fase: string;
  bacaan: { kelembapanTanah: number; suhu: number; ph: number; waktuLabel: string } | null;
  ambangKelembapan: { min: number; maks: number } | null;
  sumberAturan: string | null;
  kegiatanLabel: string | null;
}

const URUTAN_PRIORITAS: Record<Prioritas, number> = { TINGGI: 0, SEDANG: 1, RENDAH: 2 };

function labelJadwal(jadwal: Date, sekarang: Date): string {
  if (jadwal.getTime() <= sekarang.getTime() + 5 * 60_000) return "Sekarang";
  const samaHari = formatTanggalPendek(jadwal) === formatTanggalPendek(sekarang);
  return samaHari ? `Hari ini, ${formatJam(jadwal)}` : formatTanggalJam(jadwal);
}

export async function ambilRekomendasi(
  lingkup: Prisma.LahanWhereInput,
  filter: { jenis?: JenisRekomendasi; status?: StatusRekomendasi[]; take?: number } = {},
): Promise<ItemRekomendasi[]> {
  const rows = await prisma.rekomendasi.findMany({
    where: {
      dataTanam: { lahan: lingkup },
      ...(filter.jenis ? { jenis: filter.jenis } : {}),
      ...(filter.status ? { status: { in: filter.status } } : {}),
    },
    include: {
      dataTanam: { include: { lahan: { select: { id: true, nama: true } }, varietas: { select: { komoditasId: true } } } },
      kondisi: true,
      aturan: { select: { sumber: true } },
      kegiatan: { select: { tanggal: true, keterangan: true } },
    },
    orderBy: { createdAt: "desc" },
    take: filter.take ?? 100,
  });

  const ambang = await prisma.ambangBatas.findMany({ where: { parameter: "KELEMBAPAN_TANAH" } });
  const sekarang = new Date();

  return rows
    .map((r) => {
      const a = ambang.find((x) => x.komoditasId === r.dataTanam.varietas.komoditasId && x.fase === r.dataTanam.fase);
      return {
        id: r.id,
        jenis: r.jenis as JenisRekomendasi,
        tindakan: r.tindakan,
        alasan: r.alasan,
        dosis: r.dosis,
        prioritas: r.prioritas as Prioritas,
        status: r.status as StatusRekomendasi,
        jadwalLabel: labelJadwal(r.jadwal, sekarang),
        dibuatLabel: waktuRelatif(r.createdAt, sekarang),
        lahanId: r.dataTanam.lahan.id,
        lahan: r.dataTanam.lahan.nama,
        fase: r.dataTanam.fase,
        bacaan: r.kondisi
          ? {
              kelembapanTanah: r.kondisi.kelembapanTanah,
              suhu: r.kondisi.suhu,
              ph: r.kondisi.ph,
              waktuLabel: formatTanggalJam(r.kondisi.waktuCatat),
            }
          : null,
        ambangKelembapan: a ? { min: a.min, maks: a.maks } : null,
        sumberAturan: r.aturan?.sumber ?? null,
        kegiatanLabel: r.kegiatan ? `Dikerjakan ${formatTanggalJam(r.kegiatan.tanggal)}` : null,
      };
    })
    .sort((a, b) => {
      if (a.status === "MENUNGGU" && b.status !== "MENUNGGU") return -1;
      if (b.status === "MENUNGGU" && a.status !== "MENUNGGU") return 1;
      return URUTAN_PRIORITAS[a.prioritas] - URUTAN_PRIORITAS[b.prioritas];
    });
}

/** Jumlah rekomendasi per jenis & status, untuk penanda di tab. */
export async function hitungRekomendasi(lingkup: Prisma.LahanWhereInput) {
  const grup = await prisma.rekomendasi.groupBy({
    by: ["jenis", "status"],
    where: { dataTanam: { lahan: lingkup } },
    _count: { _all: true },
  });
  const ambil = (jenis: string, status?: string) =>
    grup.filter((g) => g.jenis === jenis && (!status || g.status === status)).reduce((n, g) => n + g._count._all, 0);
  return {
    SIRAM: { menunggu: ambil("SIRAM", "MENUNGGU"), total: ambil("SIRAM") },
    PUPUK: { menunggu: ambil("PUPUK", "MENUNGGU"), total: ambil("PUPUK") },
  };
}
