import { CircleCheck, Droplets, FlaskConical, History, ListTodo } from "lucide-react";
import { RecommendationCard } from "@/components/dashboard/RecommendationCard";
import { Card } from "@/components/ui/Card";
import { EmptyState, InfoNote, PageHeader, TabLinks } from "@/components/ui/misc";
import { requireUser } from "@/lib/current-user";
import { lingkupLahan } from "@/lib/data/lahan";
import { ambilRekomendasi, hitungRekomendasi } from "@/lib/data/rekomendasi";
import type { JenisRekomendasi, StatusRekomendasi } from "@/types";

export const metadata = { title: "Rekomendasi" };

const FILTER_STATUS: Record<string, { label: string; status: StatusRekomendasi[] }> = {
  aktif: { label: "Perlu dikerjakan", status: ["MENUNGGU"] },
  selesai: { label: "Sudah dikerjakan", status: ["DIKONFIRMASI"] },
  riwayat: { label: "Diabaikan & kedaluwarsa", status: ["DIABAIKAN", "KEDALUWARSA"] },
};

/** FR-15, FR-16, FR-05: rekomendasi penyiraman & pemupukan dengan konfirmasi tindakan. */
export default async function RekomendasiPage({ searchParams }: { searchParams: Promise<{ jenis?: string; status?: string }> }) {
  const user = await requireUser(["PETANI"]);
  const sp = await searchParams;
  const jenis: JenisRekomendasi = sp.jenis === "PUPUK" ? "PUPUK" : "SIRAM";
  const kunciStatus = sp.status && sp.status in FILTER_STATUS ? sp.status : "aktif";
  const lingkup = lingkupLahan(user);

  const [daftar, jumlah] = await Promise.all([
    ambilRekomendasi(lingkup, { jenis, status: FILTER_STATUS[kunciStatus].status }),
    hitungRekomendasi(lingkup),
  ]);
  const href = (j: string, s: string) => `/rekomendasi?jenis=${j}&status=${s}`;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Pendukung keputusan"
        title="Rekomendasi budidaya"
        description="Saran penyiraman dan pemupukan dari data sensor, prakiraan cuaca, dan pedoman penyuluh. Tandai setelah dikerjakan agar tercatat."
      />

      <TabLinks
        aktif={jenis}
        tabs={[
          { kunci: "SIRAM", label: "Penyiraman", href: href("SIRAM", kunciStatus), jumlah: jumlah.SIRAM.menunggu, ikon: Droplets },
          { kunci: "PUPUK", label: "Pemupukan", href: href("PUPUK", kunciStatus), jumlah: jumlah.PUPUK.menunggu, ikon: FlaskConical },
        ]}
      />

      <TabLinks
        aktif={kunciStatus}
        className="border-b border-line pb-3"
        tabs={[
          { kunci: "aktif", label: FILTER_STATUS.aktif.label, href: href(jenis, "aktif"), ikon: ListTodo },
          { kunci: "selesai", label: FILTER_STATUS.selesai.label, href: href(jenis, "selesai"), ikon: CircleCheck },
          { kunci: "riwayat", label: FILTER_STATUS.riwayat.label, href: href(jenis, "riwayat"), ikon: History },
        ]}
      />

      {daftar.length === 0 ? (
        <Card>
          <EmptyState
            icon={kunciStatus === "aktif" ? CircleCheck : History}
            title={kunciStatus === "aktif" ? `Tidak ada ${jenis === "SIRAM" ? "penyiraman" : "pemupukan"} yang perlu dikerjakan` : "Belum ada riwayat"}
            description={
              kunciStatus === "aktif"
                ? "Kondisi tanah dalam batas aman. Rekomendasi baru akan muncul otomatis saat sensor mendeteksi perubahan."
                : "Rekomendasi yang sudah diproses akan tampil di sini."
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {daftar.map((r) => (
            <RecommendationCard key={r.id} rek={r} bisaAksi />
          ))}
        </div>
      )}

      <InfoNote>
        Rekomendasi dibuat otomatis oleh mesin aturan saat data sensor diterima. Pembuatan rekomendasi baru berjalan setelah endpoint penerimaan data
        sensor (<code className="font-mono text-xs">/api/sensor/ingest</code>) selesai di Sprint 2–4. Data yang tampil saat ini berasal dari seed.
      </InfoNote>
    </div>
  );
}
