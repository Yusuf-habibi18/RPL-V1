import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { waktuRelatif } from "@/lib/format";

export interface ItemPeringatan {
  id: string;
  parameter: string;
  tingkat: "WASPADA" | "BAHAYA";
  pesan: string;
  lahanId: string;
  lahan: string;
  pemilik: string;
  waktu: Date;
  waktuLabel: string;
}

/** Peringatan aktif dalam cakupan lahan pengguna (FR-14). BAHAYA ditampilkan lebih dulu. */
export async function ambilPeringatanAktif(lingkup: Prisma.LahanWhereInput, take = 20): Promise<ItemPeringatan[]> {
  const rows = await prisma.peringatanDini.findMany({
    where: { status: "AKTIF", lahan: lingkup },
    include: { lahan: { select: { id: true, nama: true, pemilik: { select: { nama: true } } } } },
    orderBy: { createdAt: "desc" },
    take,
  });
  const sekarang = new Date();
  return rows
    .map((p) => ({
      id: p.id,
      parameter: p.parameter,
      tingkat: p.tingkat as ItemPeringatan["tingkat"],
      pesan: p.pesan,
      lahanId: p.lahan.id,
      lahan: p.lahan.nama,
      pemilik: p.lahan.pemilik.nama,
      waktu: p.createdAt,
      waktuLabel: waktuRelatif(p.createdAt, sekarang),
    }))
    .sort((a, b) => (a.tingkat === b.tingkat ? 0 : a.tingkat === "BAHAYA" ? -1 : 1));
}

export function hitungPeringatanAktif(lingkup: Prisma.LahanWhereInput) {
  return prisma.peringatanDini.count({ where: { status: "AKTIF", lahan: lingkup } });
}
