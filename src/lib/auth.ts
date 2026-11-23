import bcrypt from "bcryptjs";

export { HAK_AKSES, bolehAkses } from "@/lib/akses";

/** NFR-05: password disimpan sebagai hash bcrypt. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifikasiPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
