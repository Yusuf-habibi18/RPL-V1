import type { BacaanSensor, JenisRekomendasi, Parameter } from "@/types";
import { nilaiParameter } from "@/lib/validation";

export type Operator = "<" | "<=" | ">" | ">=";

/** Bentuk aturan seperti tersimpan di tabel AturanRekomendasi (FR-17). */
export interface Aturan {
  id: string;
  jenis: JenisRekomendasi;
  parameter: Parameter;
  operator: Operator;
  nilai: number;
  fase?: string | null; // null/undefined = semua fase
  tindakan: string;
  dosis?: string | null;
  aktif?: boolean;
}

export function bandingkan(v: number, operator: Operator, batas: number): boolean {
  switch (operator) {
    case "<":
      return v < batas;
    case "<=":
      return v <= batas;
    case ">":
      return v > batas;
    case ">=":
      return v >= batas;
  }
}

/** True bila aturan aktif, berlaku untuk fase ini, dan kondisinya terpenuhi oleh bacaan. */
export function aturanCocok(aturan: Aturan, bacaan: BacaanSensor, fase: string): boolean {
  if (aturan.aktif === false) return false;
  if (aturan.fase && aturan.fase !== fase) return false;
  return bandingkan(nilaiParameter(bacaan)[aturan.parameter], aturan.operator, aturan.nilai);
}
