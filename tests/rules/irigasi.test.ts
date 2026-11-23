import { describe, expect, it } from "vitest";
import { jadwalSiramBerikutnya, rekomendasiPenyiraman } from "@/lib/rules/irigasi";

const AMBANG = { min: 60, maks: 80 };
const bacaan = (kelembapanTanah: number) => ({ kelembapanTanah, suhu: 27, ph: 6.2 });
const jam = (h: number, m = 0) => new Date(2026, 10, 23, h, m);

describe("rekomendasiPenyiraman (FR-15, T-06)", () => {
  it("kelembapan cukup → tidak ada rekomendasi", () => {
    expect(rekomendasiPenyiraman(bacaan(70), AMBANG, null, jam(10))).toBeNull();
  });

  it("agak kering, tidak hujan → siram pada jadwal sore", () => {
    const r = rekomendasiPenyiraman(bacaan(57), AMBANG, { curahHujanMm24j: 0 }, jam(10));
    expect(r?.tindakan).toBe("Siram lahan");
    expect(r?.jadwal).toEqual(jam(16));
  });

  it("agak kering, diprakirakan hujan → tunda", () => {
    const r = rekomendasiPenyiraman(bacaan(57), AMBANG, { curahHujanMm24j: 15 }, jam(10));
    expect(r?.tindakan).toMatch(/^Tunda/);
  });

  it("kering kritis → siram sekarang walau diprakirakan hujan", () => {
    const r = rekomendasiPenyiraman(bacaan(40), AMBANG, { curahHujanMm24j: 15 }, jam(10));
    expect(r?.tindakan).toBe("Siram lahan sekarang");
    expect(r?.jadwal).toEqual(jam(10));
  });
});

describe("jadwalSiramBerikutnya", () => {
  it("dini hari → 06:00 hari ini", () => expect(jadwalSiramBerikutnya(jam(4))).toEqual(jam(6)));
  it("siang → 16:00 hari ini", () => expect(jadwalSiramBerikutnya(jam(12))).toEqual(jam(16)));
  it("malam → 06:00 besok", () =>
    expect(jadwalSiramBerikutnya(jam(17, 30))).toEqual(new Date(2026, 10, 24, 6, 0)));
});
