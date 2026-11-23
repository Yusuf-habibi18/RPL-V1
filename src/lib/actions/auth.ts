"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifikasiPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NAMA_COOKIE, buatTokenSesi, opsiCookie } from "@/lib/session";
import type { Peran } from "@/types";

export interface StatusLogin {
  error?: string;
  email?: string;
}

/** FR-01 / T-01: login dengan email & kata sandi. */
export async function login(_: StatusLogin, fd: FormData): Promise<StatusLogin> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const tujuan = String(fd.get("next") ?? "");

  if (!email || !password) return { error: "Email dan kata sandi wajib diisi.", email };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifikasiPassword(password, user.passwordHash))) {
    return { error: "Email atau kata sandi salah.", email };
  }
  if (!user.aktif) return { error: "Akun Anda dinonaktifkan. Hubungi admin sistem.", email };

  const token = await buatTokenSesi({ sub: user.id, peran: user.peran as Peran, nama: user.nama });
  (await cookies()).set(NAMA_COOKIE, token, opsiCookie);

  // Hanya izinkan tujuan internal (cegah open redirect).
  redirect(tujuan.startsWith("/") && !tujuan.startsWith("//") ? tujuan : "/dashboard");
}

export async function logout() {
  (await cookies()).delete(NAMA_COOKIE);
  redirect("/login");
}
