import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { FieldBackdrop } from "@/components/layout/FieldBackdrop";
import { requireUser } from "@/lib/current-user";
import { lingkupLahan } from "@/lib/data/lahan";
import { ambilPeringatanAktif } from "@/lib/data/peringatan";
import { formatHari } from "@/lib/format";

// Semua halaman di grup ini membutuhkan login dan data terkini.
export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const peringatan = await ambilPeringatanAktif(lingkupLahan(user), 50);

  const konteks =
    user.peran === "DINAS"
      ? user.wilayah
      : user.peran === "KETUA_KELOMPOK"
        ? (user.memimpin?.nama ?? null)
        : user.peran === "PETANI"
          ? (user.kelompok?.nama ?? null)
          : "Pengelola sistem";

  return (
    <>
      <FieldBackdrop />
      <DashboardShell
        user={{ nama: user.nama, email: user.email, peran: user.peran, konteks }}
        peringatan={peringatan.slice(0, 8).map((p) => ({
          id: p.id,
          parameter: p.parameter,
          tingkat: p.tingkat,
          pesan: p.pesan,
          lahanId: p.lahanId,
          lahan: p.lahan,
          waktuLabel: p.waktuLabel,
        }))}
        jumlahPeringatan={peringatan.length}
        tanggal={formatHari(new Date())}
      >
        {children}
      </DashboardShell>
    </>
  );
}
