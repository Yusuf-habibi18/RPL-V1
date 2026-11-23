import { ShieldX } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/misc";

export const metadata = { title: "Akses ditolak" };

/** T-02: pengguna membuka halaman di luar haknya. */
export default function AksesDitolak() {
  return (
    <Card className="mx-auto max-w-xl">
      <EmptyState
        icon={ShieldX}
        title="Akses ditolak"
        description="Halaman tersebut tidak tersedia untuk peran Anda. Bila Anda memerlukan akses, hubungi admin sistem."
        action={
          <LinkButton href="/dashboard" variant="primary" size="md">
            Kembali ke dashboard
          </LinkButton>
        }
      />
    </Card>
  );
}
