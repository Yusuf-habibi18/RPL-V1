"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { gagal, sukses, type HasilAksi } from "@/lib/actions/hasil";

function segarkan() {
  revalidatePath("/rekomendasi");
  revalidatePath("/dashboard");
}

/**
 * FR-05 / T-07: petani menandai rekomendasi sudah dikerjakan.
 * Status → DIKONFIRMASI dan tindakan dicatat sebagai KegiatanBudidaya dalam satu transaksi.
 */
export async function konfirmasiRekomendasi(id: string, catatan?: string): Promise<HasilAksi> {
  const user = await requireUser(["PETANI"]);
  const rek = await prisma.rekomendasi.findFirst({
    where: { id, dataTanam: { lahan: { pemilikId: user.id } } },
  });
  if (!rek) return gagal("Rekomendasi tidak ditemukan.");

  const berhasil = await prisma.$transaction(async (tx) => {
    // updateMany dengan syarat status mencegah konfirmasi ganda bila tombol ditekan dua kali.
    const { count } = await tx.rekomendasi.updateMany({
      where: { id, status: "MENUNGGU" },
      data: { status: "DIKONFIRMASI" },
    });
    if (count === 0) return false;
    await tx.kegiatanBudidaya.create({
      data: {
        jenis: rek.jenis,
        tanggal: new Date(),
        jumlah: rek.dosis,
        keterangan: catatan?.trim() ? catatan.trim().slice(0, 300) : rek.tindakan,
        dataTanamId: rek.dataTanamId,
        rekomendasiId: rek.id,
        dicatatOlehId: user.id,
      },
    });
    return true;
  });

  if (!berhasil) return gagal("Rekomendasi ini sudah diproses sebelumnya.");
  segarkan();
  return sukses("Tindakan dicatat sebagai kegiatan budidaya.");
}

export async function abaikanRekomendasi(id: string): Promise<HasilAksi> {
  const user = await requireUser(["PETANI"]);
  const { count } = await prisma.rekomendasi.updateMany({
    where: { id, status: "MENUNGGU", dataTanam: { lahan: { pemilikId: user.id } } },
    data: { status: "DIABAIKAN" },
  });
  if (count === 0) return gagal("Rekomendasi tidak ditemukan atau sudah diproses.");
  segarkan();
  return sukses("Rekomendasi ditandai diabaikan.");
}
