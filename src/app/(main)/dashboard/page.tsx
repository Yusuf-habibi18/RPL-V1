import { requireUser } from "@/lib/current-user";
import { AdminView } from "./_views/AdminView";
import { DinasView } from "./_views/DinasView";
import { KetuaView } from "./_views/KetuaView";
import { PetaniView } from "./_views/PetaniView";

export const metadata = { title: "Dashboard" };

/** Satu URL, isi berbeda per role (petani, ketua kelompok, dinas, admin). */
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ lahan?: string }> }) {
  const user = await requireUser();
  const { lahan } = await searchParams;

  switch (user.peran) {
    case "PETANI":
      return <PetaniView user={user} lahanId={lahan} />;
    case "KETUA_KELOMPOK":
      return <KetuaView user={user} />;
    case "DINAS":
      return <DinasView user={user} />;
    case "ADMIN":
      return <AdminView />;
  }
}
