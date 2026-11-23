import { Activity, Droplets, FileText, LayoutDashboard, Settings2, Sprout, Users, type LucideIcon } from "lucide-react";
import { bolehAkses } from "@/lib/akses";
import type { Peran } from "@/types";

export interface ItemMenu {
  href: string;
  label: string;
  /** Label pendek untuk navigasi bawah di ponsel. */
  ringkas: string;
  ikon: LucideIcon;
}

export const MENU: ItemMenu[] = [
  { href: "/dashboard", label: "Dashboard", ringkas: "Beranda", ikon: LayoutDashboard },
  { href: "/monitoring", label: "Monitoring", ringkas: "Monitor", ikon: Activity },
  { href: "/rekomendasi", label: "Rekomendasi", ringkas: "Saran", ikon: Droplets },
  { href: "/tanam-panen", label: "Tanam & Panen", ringkas: "Tanam", ikon: Sprout },
  { href: "/kelompok", label: "Kelompok Tani", ringkas: "Kelompok", ikon: Users },
  { href: "/laporan", label: "Laporan", ringkas: "Laporan", ikon: FileText },
  { href: "/admin", label: "Administrasi", ringkas: "Admin", ikon: Settings2 },
];

/** Menu yang boleh dilihat role ini (sama dengan aturan middleware). */
export const menuUntuk = (peran: Peran) => MENU.filter((m) => bolehAkses(peran, m.href));

export const aktifPada = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export const judulHalaman = (pathname: string) =>
  MENU.find((m) => aktifPada(pathname, m.href))?.label ?? (pathname.startsWith("/akses-ditolak") ? "Akses ditolak" : "");
