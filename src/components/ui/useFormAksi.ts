"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import type { HasilAksi } from "@/lib/actions/hasil";

/** Hubungkan form ke server action: galat per field, pesan umum, toast saat berhasil. */
export function useFormAksi(aksi: (fd: FormData) => Promise<HasilAksi>, onSukses?: (h: HasilAksi) => void) {
  const toast = useToast();
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [pesan, setPesan] = useState<string | null>(null);

  const kirim = async (fd: FormData) => {
    const h = await aksi(fd);
    if (h.ok) {
      setGalat({});
      setPesan(null);
      toast(h);
      onSukses?.(h);
    } else {
      setGalat(h.galat ?? {});
      setPesan(h.pesan);
    }
  };
  const reset = () => {
    setGalat({});
    setPesan(null);
  };
  return { galat, pesan, kirim, reset };
}
