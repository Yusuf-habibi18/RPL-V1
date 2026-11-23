// Tipe domain bersama. Nilai di sini adalah daftar sah untuk kolom String di prisma/schema.prisma.

export const PERAN = ["PETANI", "KETUA_KELOMPOK", "ADMIN", "DINAS"] as const;
export type Peran = (typeof PERAN)[number];

export const PARAMETER = ["KELEMBAPAN_TANAH", "SUHU", "PH"] as const;
export type Parameter = (typeof PARAMETER)[number];

export const LABEL_PERAN: Record<Peran, string> = {
  PETANI: "Petani",
  KETUA_KELOMPOK: "Ketua Kelompok Tani",
  DINAS: "Dinas Pertanian",
  ADMIN: "Admin Sistem",
};

export type JenisRekomendasi = "SIRAM" | "PUPUK";
export type StatusRekomendasi = "MENUNGGU" | "DIKONFIRMASI" | "DIABAIKAN" | "KEDALUWARSA";
export type Prioritas = "TINGGI" | "SEDANG" | "RENDAH";

/** Status kondisi lahan hasil perbandingan bacaan terakhir dengan ambang batas. */
export type StatusKondisi = "SEHAT" | "WASPADA" | "KRITIS" | "TANPA_DATA" | "KOSONG";
export type JenisKegiatan = JenisRekomendasi | "SEMPROT" | "LAINNYA";

export type TingkatPeringatan = "WASPADA" | "BAHAYA";
export type StatusPeringatan = "AKTIF" | "DITANGANI" | "SELESAI";

export type StatusSensor = "AKTIF" | "OFFLINE" | "NONAKTIF";
export type KanalNotifikasi = "WHATSAPP" | "SMS" | "PUSH" | "SIMULASI";

/** Indikator warna di dashboard (NFR-15). */
export type IndikatorWarna = "HIJAU" | "KUNING" | "MERAH";

export interface BacaanSensor {
  kelembapanTanah: number;
  suhu: number;
  ph: number;
}

export interface Ambang {
  parameter: Parameter;
  min: number;
  maks: number;
}

/** Rekomendasi hasil mesin aturan, sebelum disimpan ke tabel Rekomendasi. */
export interface DraftRekomendasi {
  jenis: JenisRekomendasi;
  jadwal: Date;
  tindakan: string;
  alasan: string;
  prioritas: Prioritas;
  dosis?: string;
  aturanId?: string;
}

export const LABEL_PARAMETER: Record<Parameter, string> = {
  KELEMBAPAN_TANAH: "Kelembapan tanah",
  SUHU: "Suhu",
  PH: "pH tanah",
};

export const SATUAN_PARAMETER: Record<Parameter, string> = {
  KELEMBAPAN_TANAH: "%",
  SUHU: "°C",
  PH: "",
};
