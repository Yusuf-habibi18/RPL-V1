import { prisma } from "@/lib/db";
import { ambilCuaca } from "@/lib/cuaca";
import type { PenggunaAktif } from "@/lib/current-user";
import { ambilRingkasanLahan, hitungStatus, lingkupLahan, statusSensor, urutkanMenurutStatus } from "@/lib/data/lahan";
import { ambilRealisasi, produksiPerBulan, rataProduktivitas } from "@/lib/data/panen";
import { ambilPeringatanAktif } from "@/lib/data/peringatan";
import { ambilRekomendasi } from "@/lib/data/rekomendasi";
import { ambilRiwayatSensor } from "@/lib/data/sensor";
import { judulKata, waktuRelatif } from "@/lib/format";
import { ZONA_WAKTU } from "@/lib/format";

// ─────────────────────────── Petani ───────────────────────────

export async function dataDashboardPetani(user: PenggunaAktif, lahanId?: string) {
  const lingkup = lingkupLahan(user);
  const [lahan, peringatan, rekomendasi] = await Promise.all([
    ambilRingkasanLahan(lingkup),
    ambilPeringatanAktif(lingkup, 10),
    ambilRekomendasi(lingkup, { status: ["MENUNGGU"], take: 20 }),
  ]);
  const terpilih = lahan.find((l) => l.id === lahanId) ?? urutkanMenurutStatus(lahan)[0] ?? null;
  const [riwayat, cuaca] = await Promise.all([
    terpilih ? ambilRiwayatSensor(terpilih.id, null, "7h") : null,
    terpilih?.kodeWilayah ? ambilCuaca(terpilih.kodeWilayah).catch(() => null) : null,
  ]);
  return { lahan, terpilih, peringatan, rekomendasi, riwayat, cuaca };
}

// ─────────────────────────── Dinas ───────────────────────────

const HARI_MS = 86_400_000;

export async function dataDashboardDinas(user: PenggunaAktif) {
  const lingkup = lingkupLahan(user);
  const setahunLalu = new Date(Date.now() - 365 * HARI_MS);
  const [lahan, jumlahPetani, musim, peringatan] = await Promise.all([
    ambilRingkasanLahan(lingkup),
    prisma.user.count({
      where: { peran: "PETANI", aktif: true, ...(user.wilayah ? { kelompok: { wilayah: user.wilayah } } : {}) },
    }),
    ambilRealisasi(lingkup, { dari: setahunLalu }),
    ambilPeringatanAktif(lingkup, 6),
  ]);

  const produktivitas = rataProduktivitas(musim);
  const aktif = lahan.filter((l) => l.tanam);

  // Perbandingan per desa (tanpa peta: lokasi lahan belum tersedia secara andal).
  const desa = new Map<string, { desa: string; lahan: number; luasHa: number; sehat: number; perhatian: number; produksiKg: number }>();
  for (const l of lahan) {
    const k = l.desa ?? "Tanpa desa";
    const d = desa.get(k) ?? { desa: k, lahan: 0, luasHa: 0, sehat: 0, perhatian: 0, produksiKg: 0 };
    d.lahan++;
    d.luasHa += l.luasHa;
    if (l.status === "SEHAT") d.sehat++;
    if (l.status === "WASPADA" || l.status === "KRITIS") d.perhatian++;
    desa.set(k, d);
  }
  for (const m of musim) {
    const d = desa.get(m.desa ?? "Tanpa desa");
    if (d) d.produksiKg += m.hasilKg;
  }

  const distribusi = (kunci: (l: (typeof aktif)[number]) => string, urutan: string[] = []) => {
    const peta = new Map<string, number>();
    for (const l of aktif) peta.set(kunci(l), (peta.get(kunci(l)) ?? 0) + l.tanam!.luasTanamHa);
    const pos = (s: string) => (urutan.includes(s) ? urutan.indexOf(s) : 99);
    return [...peta.entries()]
      .sort(([a], [b]) => pos(a) - pos(b) || a.localeCompare(b))
      .map(([label, luasHa]) => ({ label, nilai: Math.round(luasHa * 100) / 100 }));
  };
  // Urutan fase mengikuti siklus tanam (warna kategori tetap per fase).
  const urutanFase = (aktif[0]?.tanam?.fases ?? []).map((f) => judulKata(f.nama));

  // Perkiraan panen 3 bulan ke depan: luas yang akan panen × rata-rata produktivitas historis.
  const bulanKe = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_WAKTU, year: "numeric", month: "2-digit" }).format(d);
  const prakiraan: { bulan: string; luasHa: number; perkiraanKg: number }[] = [];
  const indeks = new Map<string, number>();
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() + i, 15);
    indeks.set(bulanKe(d), i);
    prakiraan.push({ bulan: d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }), luasHa: 0, perkiraanKg: 0 });
  }
  for (const l of aktif) {
    const est = l.tanam!.estimasiPanen;
    const i = est ? indeks.get(bulanKe(est)) : undefined;
    if (i === undefined) continue;
    prakiraan[i].luasHa += l.tanam!.luasTanamHa;
  }
  for (const p of prakiraan) {
    p.luasHa = Math.round(p.luasHa * 100) / 100;
    p.perkiraanKg = Math.round(p.luasHa * produktivitas);
  }

  return {
    jumlahPetani,
    lahan,
    status: hitungStatus(lahan),
    luasTotal: lahan.reduce((n, l) => n + l.luasHa, 0),
    luasTanamAktif: aktif.reduce((n, l) => n + l.tanam!.luasTanamHa, 0),
    produksiSetahun: musim.reduce((n, m) => n + m.hasilKg, 0),
    produktivitas,
    produksiBulanan: produksiPerBulan(musim, setahunLalu, new Date()),
    perDesa: [...desa.values()].map((d) => ({ ...d, luasHa: Math.round(d.luasHa * 100) / 100, produksiKg: Math.round(d.produksiKg) })),
    distribusiFase: distribusi((l) => judulKata(l.tanam!.fase), urutanFase),
    distribusiVarietas: distribusi((l) => l.tanam!.varietas),
    prakiraan,
    peringatan,
  };
}

// ─────────────────────────── Admin ───────────────────────────

export async function dataDashboardAdmin() {
  const kemarin = new Date(Date.now() - HARI_MS);
  const [pengguna, sensorDb, jumlahLahan, bacaan24, peringatan24, notifikasi24, peringatanTerbaru] = await Promise.all([
    prisma.user.groupBy({ by: ["peran", "aktif"], _count: { _all: true } }),
    prisma.perangkatSensor.findMany({
      include: { lahan: { select: { nama: true, pemilik: { select: { nama: true } } } } },
      orderBy: { kode: "asc" },
    }),
    prisma.lahan.count(),
    prisma.kondisiLahan.groupBy({ by: ["valid"], where: { diterimaPada: { gte: kemarin } }, _count: { _all: true } }),
    prisma.peringatanDini.count({ where: { createdAt: { gte: kemarin } } }),
    prisma.notifikasi.groupBy({ by: ["status"], where: { createdAt: { gte: kemarin } }, _count: { _all: true } }),
    prisma.peringatanDini.findMany({
      include: { lahan: { select: { nama: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const sekarang = new Date();
  const sensor = sensorDb.map((s) => ({
    id: s.id,
    kode: s.kode,
    lahan: s.lahan.nama,
    pemilik: s.lahan.pemilik.nama,
    status: statusSensor(s, sekarang),
    terakhirLabel: s.terakhirAktif ? waktuRelatif(s.terakhirAktif, sekarang) : "Belum pernah",
    levelBaterai: s.levelBaterai,
  }));
  const jumlah = (arr: { _count: { _all: number } }[]) => arr.reduce((n, g) => n + g._count._all, 0);

  return {
    totalPengguna: jumlah(pengguna),
    penggunaAktif: jumlah(pengguna.filter((g) => g.aktif)),
    penggunaPerPeran: ["PETANI", "KETUA_KELOMPOK", "DINAS", "ADMIN"].map((p) => ({
      peran: p,
      jumlah: jumlah(pengguna.filter((g) => g.peran === p)),
    })),
    sensor,
    sensorAktif: sensor.filter((s) => s.status === "AKTIF").length,
    sensorOffline: sensor.filter((s) => s.status === "OFFLINE").length,
    jumlahLahan,
    bacaanValid24: jumlah(bacaan24.filter((g) => g.valid)),
    bacaanTidakValid24: jumlah(bacaan24.filter((g) => !g.valid)),
    peringatan24,
    notifikasiTerkirim24: jumlah(notifikasi24.filter((g) => g.status === "TERKIRIM")),
    notifikasiGagal24: jumlah(notifikasi24.filter((g) => g.status === "GAGAL")),
    peringatanTerbaru: peringatanTerbaru.map((p) => ({
      id: p.id,
      pesan: p.pesan,
      lahan: p.lahan.nama,
      tingkat: p.tingkat,
      status: p.status,
      waktuLabel: waktuRelatif(p.createdAt, sekarang),
    })),
  };
}
