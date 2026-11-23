"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { bacaForm, dariZod, gagal, sukses, type HasilAksi } from "@/lib/actions/hasil";
import { hashPassword } from "@/lib/auth";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { RENTANG_FISIK } from "@/lib/validation";
import { PARAMETER, PERAN, type Parameter } from "@/types";

const segarkan = () => revalidatePath("/admin");
const adminSaja = () => requireUser(["ADMIN"]);

// ─────────────────────────── Pengguna (FR-02) ───────────────────────────

const skemaPengguna = z.object({
  id: z.string().optional(),
  nama: z.string({ required_error: "Nama wajib diisi" }).min(2, "Nama terlalu pendek").max(80),
  email: z.string({ required_error: "Email wajib diisi" }).email("Email tidak valid").transform((s) => s.toLowerCase()),
  peran: z.enum(PERAN, { errorMap: () => ({ message: "Pilih peran" }) }),
  password: z.string().min(8, "Minimal 8 karakter").optional(),
  noHp: z.string().regex(/^[0-9+]{8,15}$/, "Nomor HP tidak valid").optional(),
  wilayah: z.string().max(80).optional(),
  kelompokId: z.string().optional(),
});

export async function simpanPengguna(fd: FormData): Promise<HasilAksi> {
  const admin = await adminSaja();
  const p = skemaPengguna.safeParse(bacaForm(fd));
  if (!p.success) return dariZod(p.error);
  const d = p.data;

  if (!d.id && !d.password) return gagal("Kata sandi wajib untuk pengguna baru.", { password: "Wajib diisi" });
  if ((d.peran === "PETANI" || d.peran === "KETUA_KELOMPOK") && !d.kelompokId) {
    return gagal("Petani dan ketua harus masuk kelompok tani.", { kelompokId: "Pilih kelompok" });
  }
  if (d.id === admin.id && d.peran !== "ADMIN") {
    return gagal("Anda tidak dapat mengubah peran akun Anda sendiri.", { peran: "Tidak dapat diubah" });
  }
  const bentrok = await prisma.user.findFirst({ where: { email: d.email, NOT: d.id ? { id: d.id } : undefined } });
  if (bentrok) return gagal("Email sudah dipakai.", { email: "Email sudah dipakai" });

  const data = {
    nama: d.nama,
    email: d.email,
    peran: d.peran,
    noHp: d.noHp ?? null,
    wilayah: d.peran === "DINAS" ? (d.wilayah ?? null) : null,
    kelompokId: d.peran === "PETANI" || d.peran === "KETUA_KELOMPOK" ? d.kelompokId! : null,
    ...(d.password ? { passwordHash: await hashPassword(d.password) } : {}),
  };

  await prisma.$transaction(async (tx) => {
    const user = d.id
      ? await tx.user.update({ where: { id: d.id }, data })
      : await tx.user.create({ data: { ...data, passwordHash: data.passwordHash! } });
    // Sinkronkan ketua kelompok: satu pengguna memimpin paling banyak satu kelompok.
    await tx.kelompokTani.updateMany({ where: { ketuaId: user.id }, data: { ketuaId: null } });
    if (d.peran === "KETUA_KELOMPOK") {
      await tx.kelompokTani.update({ where: { id: d.kelompokId! }, data: { ketuaId: user.id } });
    }
  });
  segarkan();
  return sukses(d.id ? "Data pengguna diperbarui." : "Pengguna baru ditambahkan.");
}

export async function ubahStatusPengguna(id: string, aktif: boolean): Promise<HasilAksi> {
  const admin = await adminSaja();
  if (id === admin.id) return gagal("Anda tidak dapat menonaktifkan akun Anda sendiri.");
  await prisma.user.update({ where: { id }, data: { aktif } });
  segarkan();
  return sukses(aktif ? "Akun diaktifkan." : "Akun dinonaktifkan. Pengguna tidak dapat login.");
}

// ─────────────────────────── Sensor (FR-06) ───────────────────────────

const skemaSensor = z.object({
  kode: z
    .string({ required_error: "Kode wajib diisi" })
    .transform((s) => s.toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9-]{3,30}$/, "Gunakan huruf, angka, dan tanda hubung")),
  lahanId: z.string({ required_error: "Pilih lahan" }),
});

/** Mendaftarkan sensor dan membuat API key (NFR-08). Key hanya ditampilkan sekali. */
export async function daftarkanSensor(fd: FormData): Promise<HasilAksi> {
  await adminSaja();
  const p = skemaSensor.safeParse(bacaForm(fd));
  if (!p.success) return dariZod(p.error);
  if (await prisma.perangkatSensor.findUnique({ where: { kode: p.data.kode } })) {
    return gagal("Kode sensor sudah terdaftar.", { kode: "Sudah terdaftar" });
  }
  if (!(await prisma.lahan.findUnique({ where: { id: p.data.lahanId } }))) {
    return gagal("Lahan tidak ditemukan.", { lahanId: "Tidak ditemukan" });
  }
  const apiKey = `agri_${randomBytes(24).toString("base64url")}`;
  await prisma.perangkatSensor.create({
    data: { kode: p.data.kode, lahanId: p.data.lahanId, apiKeyHash: createHash("sha256").update(apiKey).digest("hex") },
  });
  segarkan();
  return sukses(`Sensor ${p.data.kode} terdaftar.`, { apiKey, kode: p.data.kode });
}

export async function ubahStatusSensor(id: string, nonaktif: boolean): Promise<HasilAksi> {
  await adminSaja();
  await prisma.perangkatSensor.update({ where: { id }, data: { status: nonaktif ? "NONAKTIF" : "AKTIF" } });
  segarkan();
  return sukses(nonaktif ? "Sensor dinonaktifkan." : "Sensor diaktifkan kembali.");
}

// ─────────────────────────── Ambang batas (FR-11) ───────────────────────────

const skemaAmbang = z.object({
  id: z.string(),
  min: z.coerce.number({ invalid_type_error: "Isi dengan angka" }),
  maks: z.coerce.number({ invalid_type_error: "Isi dengan angka" }),
});

export async function simpanAmbang(fd: FormData): Promise<HasilAksi> {
  await adminSaja();
  const p = skemaAmbang.safeParse(bacaForm(fd));
  if (!p.success) return dariZod(p.error);
  const { id, min, maks } = p.data;
  const ambang = await prisma.ambangBatas.findUnique({ where: { id } });
  if (!ambang) return gagal("Ambang batas tidak ditemukan.");
  if (min >= maks) return gagal("Nilai minimum harus lebih kecil dari maksimum.", { min: "Harus < maksimum" });
  const r = RENTANG_FISIK[ambang.parameter as Parameter];
  if (r && (min < r.min || maks > r.maks)) {
    return gagal(`Nilai harus dalam rentang fisik ${r.min}–${r.maks}.`, { maks: `Rentang ${r.min}–${r.maks}` });
  }
  await prisma.ambangBatas.update({ where: { id }, data: { min, maks } });
  segarkan();
  revalidatePath("/dashboard");
  return sukses("Ambang batas diperbarui. Berlaku untuk pemeriksaan berikutnya.");
}

// ─────────────────────────── Aturan rekomendasi (FR-17) ───────────────────────────

const skemaAturan = z.object({
  id: z.string().optional(),
  komoditasId: z.string({ required_error: "Pilih komoditas" }),
  jenis: z.enum(["SIRAM", "PUPUK"], { errorMap: () => ({ message: "Pilih jenis" }) }),
  fase: z.string().optional(),
  parameter: z.enum(PARAMETER, { errorMap: () => ({ message: "Pilih parameter" }) }),
  operator: z.enum(["<", "<=", ">", ">="], { errorMap: () => ({ message: "Pilih operator" }) }),
  nilai: z.coerce.number({ invalid_type_error: "Isi dengan angka" }),
  tindakan: z.string({ required_error: "Tindakan wajib diisi" }).min(5, "Terlalu pendek").max(200),
  dosis: z.string().max(100).optional(),
  sumber: z.string().max(120).optional(),
});

export async function simpanAturan(fd: FormData): Promise<HasilAksi> {
  await adminSaja();
  const p = skemaAturan.safeParse(bacaForm(fd));
  if (!p.success) return dariZod(p.error);
  const { id, ...d } = p.data;
  const r = RENTANG_FISIK[d.parameter];
  if (d.nilai < r.min || d.nilai > r.maks) {
    return gagal("Nilai di luar rentang fisik parameter.", { nilai: `Rentang ${r.min}–${r.maks}` });
  }
  const data = { ...d, fase: d.fase ?? null, dosis: d.dosis ?? null, sumber: d.sumber ?? null };
  if (id) await prisma.aturanRekomendasi.update({ where: { id }, data });
  else await prisma.aturanRekomendasi.create({ data });
  segarkan();
  return sukses(id ? "Aturan diperbarui." : "Aturan baru ditambahkan.");
}

export async function ubahStatusAturan(id: string, aktif: boolean): Promise<HasilAksi> {
  await adminSaja();
  await prisma.aturanRekomendasi.update({ where: { id }, data: { aktif } });
  segarkan();
  return sukses(aktif ? "Aturan diaktifkan." : "Aturan dinonaktifkan.");
}

export async function hapusAturan(id: string): Promise<HasilAksi> {
  await adminSaja();
  const dipakai = await prisma.rekomendasi.count({ where: { aturanId: id } });
  if (dipakai > 0) {
    await prisma.aturanRekomendasi.update({ where: { id }, data: { aktif: false } });
    segarkan();
    return sukses("Aturan sudah dipakai oleh rekomendasi, jadi dinonaktifkan (tidak dihapus) agar riwayat tetap utuh.");
  }
  await prisma.aturanRekomendasi.delete({ where: { id } });
  segarkan();
  return sukses("Aturan dihapus.");
}
