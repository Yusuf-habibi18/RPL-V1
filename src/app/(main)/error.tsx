"use client";

import { RotateCcw, ServerCrash } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/misc";

export default function Galat({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <EmptyState
        icon={ServerCrash}
        title="Data tidak dapat dimuat"
        description="Terjadi kesalahan saat mengambil data. Periksa koneksi lalu coba lagi. Bila terus terjadi, hubungi admin sistem."
        action={
          <Button onClick={reset}>
            <RotateCcw /> Coba lagi
          </Button>
        }
      />
      {error.digest && <p className="pb-5 text-center text-xs text-muted">Kode galat: {error.digest}</p>}
    </Card>
  );
}
