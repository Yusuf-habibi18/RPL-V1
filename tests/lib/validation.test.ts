import { describe, expect, it } from "vitest";
import { payloadIngestSchema, validasiRentangFisik } from "@/lib/validation";

describe("validasiRentangFisik (NFR-25, T-04)", () => {
  it("bacaan wajar → valid", () => {
    expect(validasiRentangFisik({ kelembapanTanah: 70, suhu: 27, ph: 6.2 })).toEqual({ valid: true, alasan: [] });
  });

  it("kelembapan 150% → tidak valid", () => {
    const h = validasiRentangFisik({ kelembapanTanah: 150, suhu: 27, ph: 6.2 });
    expect(h.valid).toBe(false);
    expect(h.alasan[0]).toContain("KELEMBAPAN_TANAH");
  });

  it("pH negatif dan NaN → tidak valid", () => {
    expect(validasiRentangFisik({ kelembapanTanah: 70, suhu: 27, ph: -1 }).valid).toBe(false);
    expect(validasiRentangFisik({ kelembapanTanah: Number.NaN, suhu: 27, ph: 6 }).valid).toBe(false);
  });
});

describe("payloadIngestSchema (FR-07, NFR-11)", () => {
  const satu = { kodeSensor: "SENSOR-001", waktuCatat: "2026-11-23T10:00:00Z", kelembapanTanah: 70, suhu: 27, ph: 6.2 };

  it("menerima satu bacaan dan mengubah waktuCatat menjadi Date", () => {
    const hasil = payloadIngestSchema.parse(satu);
    expect(Array.isArray(hasil)).toBe(false);
    expect((hasil as { waktuCatat: Date }).waktuCatat).toBeInstanceOf(Date);
  });

  it("menerima array bacaan (antrean offline)", () => {
    expect(payloadIngestSchema.safeParse([satu, satu]).success).toBe(true);
  });

  it("menolak payload tanpa kodeSensor atau array kosong", () => {
    const { kodeSensor: _, ...tanpaKode } = satu;
    expect(payloadIngestSchema.safeParse(tanpaKode).success).toBe(false);
    expect(payloadIngestSchema.safeParse([]).success).toBe(false);
  });
});
