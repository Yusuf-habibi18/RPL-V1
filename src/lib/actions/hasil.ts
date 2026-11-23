import type { ZodError } from "zod";

/** Hasil standar server action untuk ditampilkan di UI (toast / pesan form). */
export interface HasilAksi {
  ok: boolean;
  pesan: string;
  galat?: Record<string, string>;
  data?: Record<string, string>;
}

export const sukses = (pesan: string, data?: Record<string, string>): HasilAksi => ({ ok: true, pesan, data });
export const gagal = (pesan: string, galat?: Record<string, string>): HasilAksi => ({ ok: false, pesan, galat });

export function dariZod(err: ZodError): HasilAksi {
  const galat: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "_");
    galat[k] ??= i.message;
  }
  return gagal("Periksa kembali isian yang ditandai.", galat);
}

/** FormData → objek string biasa (kosong = undefined). */
export function bacaForm(fd: FormData): Record<string, string | undefined> {
  const o: Record<string, string | undefined> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") o[k] = v.trim() === "" ? undefined : v.trim();
  }
  return o;
}
