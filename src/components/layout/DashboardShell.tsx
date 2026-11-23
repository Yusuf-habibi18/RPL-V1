"use client";

import { useState, type ReactNode } from "react";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ToastProvider } from "@/components/ui/Toast";
import type { Peran } from "@/types";

export interface PenggunaShell {
  nama: string;
  email: string;
  peran: Peran;
  /** Kelompok / wilayah, ditampilkan di bawah nama. */
  konteks: string | null;
}

export interface PeringatanShell {
  id: string;
  parameter: string;
  tingkat: "WASPADA" | "BAHAYA";
  pesan: string;
  lahanId: string;
  lahan: string;
  waktuLabel: string;
}

/** Kerangka dashboard: sidebar (desktop), topbar, konten, navigasi bawah & laci (ponsel). */
export function DashboardShell({
  user,
  peringatan,
  jumlahPeringatan,
  tanggal,
  children,
}: {
  user: PenggunaShell;
  peringatan: PeringatanShell[];
  jumlahPeringatan: number;
  tanggal: string;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <ToastProvider>
      <a
        href="#konten"
        className="sr-only z-[70] rounded-lg bg-primary px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Lewati ke konten
      </a>
      <Sidebar user={user} />
      <div className="relative lg:pl-64">
        <Topbar
          user={user}
          peringatan={peringatan}
          jumlahPeringatan={jumlahPeringatan}
          tanggal={tanggal}
          onMenu={() => setDrawerOpen(true)}
        />
        <main id="konten" className="relative mx-auto w-full max-w-[1400px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>
      <MobileNavigation user={user} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
    </ToastProvider>
  );
}
