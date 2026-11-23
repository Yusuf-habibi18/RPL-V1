import type { BacaanSensor, DraftRekomendasi } from "@/types";
import { LABEL_PARAMETER } from "@/types";
import { nilaiParameter } from "@/lib/validation";
import { formatAngka, judulKata } from "@/lib/format";
import { aturanCocok, type Aturan } from "@/lib/rules/engine";

/**
 * FR-16: rekomendasi pemupukan berdasarkan pH dan fase tanam.
 * Isi aturannya (pH berapa → pupuk apa, dosis) berasal dari penyuluh dan
 * dikelola admin di tabel AturanRekomendasi, bukan ditulis di kode (NFR-20).
 */
export function rekomendasiPemupukan(
  bacaan: BacaanSensor,
  fase: string,
  aturan: Aturan[],
  sekarang: Date = new Date(),
): DraftRekomendasi[] {
  const nilai = nilaiParameter(bacaan);
  return aturan
    .filter((a) => a.jenis === "PUPUK" && aturanCocok(a, bacaan, fase))
    .map((a) => ({
      jenis: "PUPUK" as const,
      jadwal: sekarang,
      tindakan: a.tindakan,
      dosis: a.dosis ?? undefined,
      alasan: `${LABEL_PARAMETER[a.parameter]} ${formatAngka(nilai[a.parameter], 2)} (${a.operator} ${formatAngka(a.nilai, 2)}) pada fase ${judulKata(fase).toLowerCase()}.`,
      prioritas: "SEDANG" as const,
      aturanId: a.id,
    }));
}
