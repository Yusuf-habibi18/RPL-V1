import { describe, expect, it } from "vitest";
import { estimasiTanggalPanen, hitungHst, sisaHariMenujuPanen, tentukanFase } from "@/lib/rules/estimasi-panen";

const FASE = [
  { nama: "VEGETATIF", hstMulai: 0, hstSelesai: 30 },
  { nama: "BERBUNGA", hstMulai: 31, hstSelesai: 55 },
  { nama: "BERBUAH", hstMulai: 56, hstSelesai: 79 },
  { nama: "PANEN", hstMulai: 80, hstSelesai: 120 },
];

describe("hitungHst", () => {
  it("menghitung selisih hari kalender", () => {
    expect(hitungHst(new Date(2026, 0, 1), new Date(2026, 0, 11))).toBe(10);
  });
  it("jam diabaikan: tanam 23:00, besok 01:00 → 1 HST", () => {
    expect(hitungHst(new Date(2026, 0, 1, 23), new Date(2026, 0, 2, 1))).toBe(1);
  });
});

describe("estimasiTanggalPanen (FR-18, T-08)", () => {
  it("tanggal tanam + umur panen HST", () => {
    expect(estimasiTanggalPanen(new Date(2026, 0, 1), 80)).toEqual(new Date(2026, 2, 22));
  });
  it("sisa hari menuju panen", () => {
    expect(sisaHariMenujuPanen(new Date(2026, 0, 1), 80, new Date(2026, 0, 31))).toBe(50);
  });
});

describe("tentukanFase", () => {
  it("memetakan HST ke fase", () => {
    expect(tentukanFase(10, FASE)).toBe("VEGETATIF");
    expect(tentukanFase(31, FASE)).toBe("BERBUNGA");
    expect(tentukanFase(79, FASE)).toBe("BERBUAH");
  });
  it("melewati fase terakhir → tetap fase terakhir; sebelum tanam → null", () => {
    expect(tentukanFase(200, FASE)).toBe("PANEN");
    expect(tentukanFase(-1, FASE)).toBeNull();
  });
});
