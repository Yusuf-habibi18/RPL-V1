import { Cpu, ListChecks, SlidersHorizontal, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PageHeader, TabLinks } from "@/components/ui/misc";
import { requireUser } from "@/lib/current-user";
import { dataAdmin } from "@/lib/data/admin";
import { PanelAmbang, PanelAturan, PanelPengguna, PanelSensor } from "./_components";

export const metadata = { title: "Administrasi" };

const TAB = ["pengguna", "sensor", "ambang", "aturan"] as const;
type Tab = (typeof TAB)[number];

/** FR-02, FR-06, FR-11, FR-17: pengguna, sensor, ambang batas, aturan rekomendasi. */
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireUser(["ADMIN"]);
  const { tab: t } = await searchParams;
  const tab: Tab = TAB.includes(t as Tab) ? (t as Tab) : "pengguna";
  const d = await dataAdmin();

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Pusat kendali" title="Administrasi" description="Kelola akun, perangkat sensor, ambang batas peringatan, dan aturan rekomendasi." />

      <TabLinks
        aktif={tab}
        tabs={[
          { kunci: "pengguna", label: "Pengguna", href: "/admin?tab=pengguna", ikon: Users, jumlah: d.pengguna.length },
          { kunci: "sensor", label: "Sensor", href: "/admin?tab=sensor", ikon: Cpu, jumlah: d.sensor.length },
          { kunci: "ambang", label: "Ambang batas", href: "/admin?tab=ambang", ikon: SlidersHorizontal },
          { kunci: "aturan", label: "Aturan rekomendasi", href: "/admin?tab=aturan", ikon: ListChecks, jumlah: d.aturan.length },
        ]}
      />

      <Card className="p-5">
        {tab === "pengguna" && <PanelPengguna pengguna={d.pengguna} opsiKelompok={d.opsiKelompok} />}
        {tab === "sensor" && <PanelSensor sensor={d.sensor} opsiLahan={d.opsiLahan} />}
        {tab === "ambang" && <PanelAmbang ambang={d.ambang} />}
        {tab === "aturan" && <PanelAturan aturan={d.aturan} opsiKomoditas={d.opsiKomoditas} />}
      </Card>
    </div>
  );
}
