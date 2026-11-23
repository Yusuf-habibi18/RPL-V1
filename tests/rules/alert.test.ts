import { describe, expect, it } from "vitest";
import { indikatorWarna, periksaAmbang, pesanPeringatan, sensorOffline } from "@/lib/rules/alert";
import type { Ambang } from "@/types";

const AMBANG: Ambang[] = [
  { parameter: "KELEMBAPAN_TANAH", min: 60, maks: 80 },
  { parameter: "SUHU", min: 20, maks: 32 },
  { parameter: "PH", min: 5.5, maks: 7 },
];

describe("periksaAmbang (FR-12, T-05)", () => {
  it("tidak ada pelanggaran bila semua nilai dalam batas", () => {
    expect(periksaAmbang({ kelembapanTanah: 70, suhu: 27, ph: 6.2 }, AMBANG)).toEqual([]);
  });

  it("nilai tepat di batas min/maks masih aman", () => {
    expect(periksaAmbang({ kelembapanTanah: 60, suhu: 32, ph: 7 }, AMBANG)).toEqual([]);
  });

  it("kelembapan sedikit di bawah batas → WASPADA", () => {
    const [p] = periksaAmbang({ kelembapanTanah: 58, suhu: 27, ph: 6.2 }, AMBANG);
    expect(p).toMatchObject({ parameter: "KELEMBAPAN_TANAH", arah: "RENDAH", tingkat: "WASPADA" });
  });

  it("kelembapan jauh di bawah batas → BAHAYA", () => {
    const [p] = periksaAmbang({ kelembapanTanah: 40, suhu: 27, ph: 6.2 }, AMBANG);
    expect(p.tingkat).toBe("BAHAYA");
  });

  it("mendeteksi nilai terlalu tinggi dan beberapa pelanggaran sekaligus", () => {
    const hasil = periksaAmbang({ kelembapanTanah: 50, suhu: 35, ph: 7.5 }, AMBANG);
    expect(hasil.map((p) => [p.parameter, p.arah])).toEqual([
      ["KELEMBAPAN_TANAH", "RENDAH"],
      ["SUHU", "TINGGI"],
      ["PH", "TINGGI"],
    ]);
  });
});

describe("indikatorWarna (NFR-15)", () => {
  it("hijau / kuning / merah", () => {
    expect(indikatorWarna([])).toBe("HIJAU");
    expect(indikatorWarna(periksaAmbang({ kelembapanTanah: 58, suhu: 27, ph: 6.2 }, AMBANG))).toBe("KUNING");
    expect(indikatorWarna(periksaAmbang({ kelembapanTanah: 40, suhu: 27, ph: 6.2 }, AMBANG))).toBe("MERAH");
  });
});

describe("pesanPeringatan", () => {
  it("memakai bahasa sederhana lengkap dengan batas aman", () => {
    const [p] = periksaAmbang({ kelembapanTanah: 45, suhu: 27, ph: 6.2 }, AMBANG);
    expect(pesanPeringatan(p)).toBe("Kelembapan tanah terlalu rendah (45%). Batas aman 60–80%.");
  });
});

describe("sensorOffline (NFR-13)", () => {
  const sekarang = new Date("2026-11-23T10:00:00Z");
  it("belum pernah mengirim → offline", () => expect(sensorOffline(null, sekarang)).toBe(true));
  it("10 menit lalu → aktif", () =>
    expect(sensorOffline(new Date("2026-11-23T09:50:00Z"), sekarang)).toBe(false));
  it("31 menit lalu → offline", () =>
    expect(sensorOffline(new Date("2026-11-23T09:29:00Z"), sekarang)).toBe(true));
});
