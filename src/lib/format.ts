// Format tampilan (bahasa Indonesia, zona WIB). Aman dipakai di server maupun client.

export const ZONA_WAKTU = "Asia/Jakarta";

type Tgl = Date | string | number;
const keDate = (d: Tgl) => (d instanceof Date ? d : new Date(d));

export const formatTanggal = (d: Tgl, bulan: "short" | "long" = "short") =>
  keDate(d).toLocaleDateString("id-ID", { timeZone: ZONA_WAKTU, day: "numeric", month: bulan, year: "numeric" });

export const formatTanggalPendek = (d: Tgl) =>
  keDate(d).toLocaleDateString("id-ID", { timeZone: ZONA_WAKTU, day: "numeric", month: "short" });

export const formatHari = (d: Tgl) =>
  keDate(d).toLocaleDateString("id-ID", {
    timeZone: ZONA_WAKTU,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const formatJam = (d: Tgl) =>
  keDate(d).toLocaleTimeString("id-ID", { timeZone: ZONA_WAKTU, hour: "2-digit", minute: "2-digit" });

export const formatTanggalJam = (d: Tgl) => `${formatTanggalPendek(d)}, ${formatJam(d)}`;

export function waktuRelatif(d: Tgl, sekarang: Date = new Date()): string {
  const detik = Math.round((sekarang.getTime() - keDate(d).getTime()) / 1000);
  if (detik < 0) {
    const hari = Math.ceil(-detik / 86400);
    return hari <= 1 ? "hari ini" : `${hari} hari lagi`;
  }
  if (detik < 60) return "baru saja";
  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 30) return `${hari} hari lalu`;
  return formatTanggal(d);
}

export const formatAngka = (n: number, digit = 1) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: digit });

export const formatBerat = (kg: number) =>
  kg >= 1000 ? `${formatAngka(kg / 1000, 1)} ton` : `${formatAngka(kg, 0)} kg`;

export const formatLuas = (ha: number) => `${formatAngka(ha, 2)} ha`;

export function salam(sekarang: Date = new Date()): string {
  const jam = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: ZONA_WAKTU, hour: "numeric", hour12: false }).format(sekarang),
  );
  if (jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 18) return "Selamat sore";
  return "Selamat malam";
}

/** "BERBUNGA" → "Berbunga", "KETUA_KELOMPOK" → "Ketua Kelompok" */
export const judulKata = (s: string) =>
  s
    .toLowerCase()
    .split("_")
    .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
    .join(" ");

export const inisial = (nama: string) =>
  nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase())
    .join("");
