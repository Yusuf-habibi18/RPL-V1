import type { KanalNotifikasi } from "@/types";

export interface PesanNotifikasi {
  kanal: KanalNotifikasi;
  tujuan: string; // nomor HP atau id perangkat
  isi: string;
}

export interface HasilKirim {
  status: "TERKIRIM" | "GAGAL";
  kanal: KanalNotifikasi;
  error?: string;
}

/**
 * FR-13: kirim notifikasi peringatan.
 * Mode "simulasi" (default) hanya mencetak ke console sehingga bisa diuji tanpa
 * biaya penyedia WhatsApp/SMS. Hasilnya tetap disimpan ke tabel Notifikasi.
 */
export async function kirimNotifikasi(pesan: PesanNotifikasi): Promise<HasilKirim> {
  const mode = process.env.NOTIFIKASI_MODE ?? "simulasi";

  if (mode === "simulasi") {
    console.info(`[notifikasi:${pesan.kanal}] → ${pesan.tujuan}: ${pesan.isi}`);
    return { status: "TERKIRIM", kanal: "SIMULASI" };
  }

  // TODO Sprint 3: hubungkan ke penyedia WhatsApp/SMS yang dipilih tim.
  return { status: "GAGAL", kanal: pesan.kanal, error: "Penyedia notifikasi belum dikonfigurasi" };
}
