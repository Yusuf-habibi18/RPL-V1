// Token sesi (JWT HS256) di cookie httpOnly. Edge-safe: dipakai middleware dan server.
import { SignJWT, jwtVerify } from "jose";
import { PERAN, type Peran } from "@/types";

export const NAMA_COOKIE = "agri_sesi";

/** NFR-09: sesi berakhir setelah tidak aktif selama ini (diperpanjang di setiap permintaan). */
export const BATAS_SESI_MENIT = 30;

export interface DataSesi {
  sub: string; // id pengguna
  peran: Peran;
  nama: string;
}

function kunci(): Uint8Array {
  const rahasia = process.env.SESSION_SECRET;
  if (!rahasia) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET belum diisi");
    return new TextEncoder().encode("dev-only-secret-ganti-di-file-env-0123456789");
  }
  return new TextEncoder().encode(rahasia);
}

export function buatTokenSesi(data: DataSesi): Promise<string> {
  return new SignJWT({ peran: data.peran, nama: data.nama })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(data.sub)
    .setIssuedAt()
    .setExpirationTime(`${BATAS_SESI_MENIT}m`)
    .sign(kunci());
}

export async function bacaTokenSesi(token: string | undefined): Promise<DataSesi | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, kunci(), { algorithms: ["HS256"] });
    const peran = payload.peran as Peran;
    if (!payload.sub || !PERAN.includes(peran)) return null;
    return { sub: payload.sub, peran, nama: String(payload.nama ?? "") };
  } catch {
    return null;
  }
}

export const opsiCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: BATAS_SESI_MENIT * 60,
};
