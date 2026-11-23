import { describe, expect, it } from "vitest";
import { bolehAkses, hashPassword, verifikasiPassword } from "@/lib/auth";

describe("bolehAkses (FR-02, T-02)", () => {
  it("petani tidak boleh membuka halaman admin", () => {
    expect(bolehAkses("PETANI", "/admin")).toBe(false);
    expect(bolehAkses("PETANI", "/admin/sensor")).toBe(false);
  });
  it("admin boleh membuka halaman admin", () => {
    expect(bolehAkses("ADMIN", "/admin/sensor")).toBe(true);
  });
  it("semua role punya dashboard (isinya berbeda per role)", () => {
    for (const peran of ["PETANI", "KETUA_KELOMPOK", "DINAS", "ADMIN"] as const) {
      expect(bolehAkses(peran, "/dashboard")).toBe(true);
    }
  });
  it("rekomendasi & tanam-panen khusus petani; kelompok khusus ketua", () => {
    expect(bolehAkses("KETUA_KELOMPOK", "/rekomendasi")).toBe(false);
    expect(bolehAkses("DINAS", "/tanam-panen")).toBe(false);
    expect(bolehAkses("PETANI", "/kelompok")).toBe(false);
    expect(bolehAkses("KETUA_KELOMPOK", "/kelompok")).toBe(true);
  });
  it("dinas tidak boleh membuka monitoring sensor per lahan", () => {
    expect(bolehAkses("DINAS", "/monitoring")).toBe(false);
  });
  it("semua role boleh membuka laporan (FR-23)", () => {
    for (const peran of ["PETANI", "KETUA_KELOMPOK", "DINAS", "ADMIN"] as const) {
      expect(bolehAkses(peran, "/laporan")).toBe(true);
    }
  });
});

describe("hash password (NFR-05)", () => {
  it("hash tidak sama dengan password dan bisa diverifikasi", async () => {
    const hash = await hashPassword("rahasia123");
    expect(hash).not.toBe("rahasia123");
    expect(await verifikasiPassword("rahasia123", hash)).toBe(true);
    expect(await verifikasiPassword("salah", hash)).toBe(false);
  });
});
