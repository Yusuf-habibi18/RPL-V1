"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { bacaForm, dariZod, gagal, sukses, type HasilAksi } from "@/lib/actions/hasil";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { estimasiTanggalPanen, hitungHst, tentukanFase } from "@/lib/rules/estimasi-panen";
import { HARI_SEBELUM_PANEN_BOLEH_CATAT } from "@/lib/data/panen";

const tanggal = z
  .string({ required_error: "Tanggal wajib diisi" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid")
  .transform((s) => new Date(`${s}T07:00:00+07:00`));

const skemaTanam = z.object({
  lahanId: z.string({ required_error: "Pilih lahan" }),
  varietasId: z.string({ required_error: "Pilih varietas" }),
  tanggalTanam: tanggal,
  luasTanamHa: z.coerce.number({ invalid_type_error: "Isi dengan angka" }).positive("Luas harus lebih dari 0"),
});

function segarkan() {
  revalidatePath("/tanam-panen");
  revalidatePath("/dashboard");
}

/** FR-04: catat data tanam baru. Fase dan estimasi panen dihitung otomatis (FR-18). */
export async function tambahDataTanam(fd: FormData): Promise<HasilAksi> {
  const user = await requireUser(["PETANI"]);
  const p = skemaTanam.safeParse(bacaForm(fd));
  if (!p.success) return dariZod(p.error);
  const { lahanId, varietasId, tanggalTanam, luasTanamHa } = p.data;

  const lahan = await prisma.lahan.findFirst({
    where: { id: lahanId, pemilikId: user.id },
    include: { dataTanam: { where: { status: "AKTIF" }, select: { id: true } } },
  });
  if (!lahan) return gagal("Lahan tidak ditemukan.", { lahanId: "Lahan tidak ditemukan" });
  if (lahan.dataTanam.length > 0) {
    return gagal("Lahan ini masih memiliki tanaman aktif. Catat hasil panennya dulu.", {
      lahanId: "Masih ada tanaman aktif",
    });
  }
  if (luasTanamHa > lahan.luasHa) {
    return gagal("Luas tanam melebihi luas lahan.", { luasTanamHa: `Maksimal ${lahan.luasHa} ha` });
  }
  const hst = hitungHst(tanggalTanam);
  if (hst < 0) return gagal("Tanggal tanam tidak boleh di masa depan.", { tanggalTanam: "Tidak boleh melewati hari ini" });
  if (hst > 365) return gagal("Tanggal tanam terlalu lama.", { tanggalTanam: "Maksimal 1 tahun lalu" });

  const varietas = await prisma.varietas.findUnique({
    where: { id: varietasId },
    include: { komoditas: { include: { fase: true } } },
  });
  if (!varietas) return gagal("Varietas tidak ditemukan.", { varietasId: "Varietas tidak ditemukan" });

  await prisma.dataTanam.create({
    data: {
      lahanId,
      varietasId,
      tanggalTanam,
      luasTanamHa,
      fase: tentukanFase(hst, varietas.komoditas.fase) ?? varietas.komoditas.fase[0]?.nama ?? "VEGETATIF",
      estimasi: {
        create: { tanggalEstimasi: estimasiTanggalPanen(tanggalTanam, varietas.umurPanenHst), metode: "ATURAN" },
      },
    },
  });
  segarkan();
  return sukses(`Data tanam di ${lahan.nama} tersimpan.`);
}

const skemaPanen = z.object({
  dataTanamId: z.string(),
  tanggalPanen: tanggal,
  hasilKg: z.coerce.number({ invalid_type_error: "Isi dengan angka" }).positive("Hasil harus lebih dari 0"),
  catatan: z.string().max(300).optional(),
});

/** FR-19: catat realisasi panen; data tanam ditutup (SELESAI). */
export async function catatRealisasiPanen(fd: FormData): Promise<HasilAksi> {
  const user = await requireUser(["PETANI"]);
  const p = skemaPanen.safeParse(bacaForm(fd));
  if (!p.success) return dariZod(p.error);
  const { dataTanamId, tanggalPanen, hasilKg, catatan } = p.data;

  const tanam = await prisma.dataTanam.findFirst({
    where: { id: dataTanamId, lahan: { pemilikId: user.id } },
    include: { varietas: true, lahan: true, realisasi: true },
  });
  if (!tanam) return gagal("Data tanam tidak ditemukan.");
  if (tanam.status !== "AKTIF" || tanam.realisasi) return gagal("Hasil panen untuk tanaman ini sudah dicatat.");
  if (hitungHst(tanam.tanggalTanam) < tanam.varietas.umurPanenHst - HARI_SEBELUM_PANEN_BOLEH_CATAT) {
    return gagal("Tanaman belum memasuki masa panen.");
  }
  if (tanggalPanen < tanam.tanggalTanam || hitungHst(tanggalPanen) < 0) {
    return gagal("Tanggal panen tidak valid.", { tanggalPanen: "Antara tanggal tanam dan hari ini" });
  }

  await prisma.$transaction([
    prisma.realisasiPanen.create({ data: { dataTanamId, tanggalPanen, hasilKg, catatan } }),
    prisma.dataTanam.update({ where: { id: dataTanamId }, data: { status: "SELESAI", fase: "PANEN" } }),
  ]);
  segarkan();
  return sukses(`Hasil panen ${tanam.lahan.nama} tersimpan.`);
}
