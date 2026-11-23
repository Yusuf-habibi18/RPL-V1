import { describe, expect, it } from "vitest";
import type { Aturan } from "@/lib/rules/engine";
import { rekomendasiPemupukan } from "@/lib/rules/pemupukan";

const ATURAN: Aturan[] = [
  { id: "a1", jenis: "PUPUK", parameter: "PH", operator: "<", nilai: 5.5, tindakan: "Taburkan dolomit", dosis: "1 kg/bedengan" },
  { id: "a2", jenis: "PUPUK", parameter: "PH", operator: ">", nilai: 7, tindakan: "Pupuk asam" },
  { id: "a3", jenis: "PUPUK", parameter: "PH", operator: "<", nilai: 6, fase: "BERBUAH", tindakan: "Khusus fase berbuah" },
  { id: "a4", jenis: "PUPUK", parameter: "PH", operator: "<", nilai: 6, aktif: false, tindakan: "Aturan nonaktif" },
];

const bacaan = (ph: number) => ({ kelembapanTanah: 70, suhu: 27, ph });

describe("rekomendasiPemupukan (FR-16, T-06)", () => {
  it("pH rendah → rekomendasi dolomit beserta dosis dan aturan asal", () => {
    const [r] = rekomendasiPemupukan(bacaan(5.0), "VEGETATIF", ATURAN);
    expect(r).toMatchObject({ jenis: "PUPUK", tindakan: "Taburkan dolomit", dosis: "1 kg/bedengan", aturanId: "a1" });
  });

  it("pH normal → tidak ada rekomendasi", () => {
    expect(rekomendasiPemupukan(bacaan(6.3), "VEGETATIF", ATURAN)).toEqual([]);
  });

  it("aturan khusus fase hanya berlaku di fase tersebut", () => {
    expect(rekomendasiPemupukan(bacaan(5.8), "VEGETATIF", ATURAN)).toEqual([]);
    expect(rekomendasiPemupukan(bacaan(5.8), "BERBUAH", ATURAN).map((r) => r.aturanId)).toEqual(["a3"]);
  });

  it("aturan nonaktif diabaikan", () => {
    const ids = rekomendasiPemupukan(bacaan(5.0), "BERBUAH", ATURAN).map((r) => r.aturanId);
    expect(ids).not.toContain("a4");
  });
});
