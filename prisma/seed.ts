/**
 * Data dummy untuk pengembangan. Jalankan: npm run db:seed
 * Seed menghapus seluruh isi database lalu mengisinya ulang.
 *
 * - Riwayat sensor 30 hari (tiap 30 menit) dibangkitkan secara deterministik per skenario lahan.
 * - Peringatan & rekomendasi TIDAK ditulis manual: dihasilkan oleh mesin aturan aplikasi
 *   (src/lib/rules) yang dijalankan atas riwayat tersebut.
 * - Komoditas, ambang batas, dan aturan adalah CONTOH (cabai merah). Ganti sesuai
 *   komoditas yang dipilih dan validasi angkanya ke penyuluh.
 *
 * Data waktu relatif terhadap saat seed dijalankan. Jalankan ulang seed sebelum demo
 * agar sensor tampil "terhubung" (sensor dianggap offline setelah 30 menit tanpa data).
 */
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { periksaAmbang, pesanPeringatan } from "../src/lib/rules/alert";
import { estimasiTanggalPanen, hitungHst, tentukanFase } from "../src/lib/rules/estimasi-panen";
import { rekomendasiPenyiraman } from "../src/lib/rules/irigasi";
import { rekomendasiPemupukan } from "../src/lib/rules/pemupukan";
import type { Aturan } from "../src/lib/rules/engine";
import { validasiRentangFisik } from "../src/lib/validation";
import type { Ambang, Parameter } from "../src/types";

const prisma = new PrismaClient();

// ─────────────────────────── Utilitas ───────────────────────────

const PASSWORD_DEMO = "password123";
const MENIT = 60_000;
const JAM = 60 * MENIT;
const HARI = 24 * JAM;
const LANGKAH = 30 * MENIT;
const HARI_RIWAYAT = 30;
const SEKARANG = new Date(Math.floor(Date.now() / LANGKAH) * LANGKAH);

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const bulat = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

/** PRNG deterministik agar data seed selalu sama polanya. */
function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const acak = mulberry32(20261123);
const antara = (min: number, maks: number) => min + acak() * (maks - min);

// ─────────────────────────── Data master ───────────────────────────

const FASE = [
  { nama: "VEGETATIF", urutan: 1, hstMulai: 0, hstSelesai: 30 },
  { nama: "BERBUNGA", urutan: 2, hstMulai: 31, hstSelesai: 55 },
  { nama: "BERBUAH", urutan: 3, hstMulai: 56, hstSelesai: 79 },
  { nama: "PANEN", urutan: 4, hstMulai: 80, hstSelesai: 120 },
];

const AMBANG: Ambang[] = [
  { parameter: "KELEMBAPAN_TANAH", min: 60, maks: 80 },
  { parameter: "SUHU", min: 20, maks: 32 },
  { parameter: "PH", min: 5.5, maks: 7.0 },
];
const AMBANG_KELEMBAPAN = { min: 60, maks: 80 };

const VARIETAS = [
  { nama: "Varietas A", umurPanenHst: 80 },
  { nama: "Varietas B", umurPanenHst: 90 },
];

const KELOMPOK = [
  { kunci: "makmur", nama: "Kelompok Tani Makmur", desa: "Sukamaju" },
  { kunci: "rejeki", nama: "Kelompok Tani Sri Rejeki", desa: "Mekarsari" },
];
const WILAYAH = "Kecamatan Contoh";

const PETANI = [
  { kunci: "budi", email: "petani1@agri.local", nama: "Budi Santoso", kelompok: "makmur" },
  { kunci: "siti", email: "petani2@agri.local", nama: "Siti Aminah", kelompok: "makmur" },
  { kunci: "joko", email: "petani3@agri.local", nama: "Joko Susilo", kelompok: "makmur" },
  { kunci: "rina", email: "petani4@agri.local", nama: "Rina Wati", kelompok: "rejeki" },
  { kunci: "agus", email: "petani5@agri.local", nama: "Agus Salim", kelompok: "rejeki" },
  { kunci: "dewi", email: "petani6@agri.local", nama: "Dewi Lestari", kelompok: "rejeki" },
];

type Skenario = "sehat" | "mengering" | "ph-turun" | "panas" | "sensor-mati";

const LAHAN: {
  nama: string;
  luasHa: number;
  pemilik: string;
  hst: number;
  varietas: number;
  skenario: Skenario;
  /** Episode kering ~10 hari lalu yang ditangani petani lewat rekomendasi. */
  episodeKering?: boolean;
  jenisTanah: string;
}[] = [
  { nama: "Sawah Utara", luasHa: 0.5, pemilik: "budi", hst: 40, varietas: 0, skenario: "mengering", jenisTanah: "Lempung berpasir" },
  { nama: "Kebun Belakang", luasHa: 0.25, pemilik: "budi", hst: 24, varietas: 0, skenario: "sehat", episodeKering: true, jenisTanah: "Lempung" },
  { nama: "Lahan Timur", luasHa: 0.75, pemilik: "siti", hst: 70, varietas: 1, skenario: "ph-turun", jenisTanah: "Liat berpasir" },
  { nama: "Ladang Barat", luasHa: 0.4, pemilik: "joko", hst: 83, varietas: 0, skenario: "sensor-mati", jenisTanah: "Lempung berdebu" },
  { nama: "Kebun Mekar", luasHa: 0.6, pemilik: "rina", hst: 12, varietas: 1, skenario: "sehat", jenisTanah: "Lempung" },
  { nama: "Sawah Kali", luasHa: 0.35, pemilik: "agus", hst: 55, varietas: 0, skenario: "panas", jenisTanah: "Lempung berpasir" },
  { nama: "Ladang Sari", luasHa: 0.8, pemilik: "dewi", hst: 66, varietas: 1, skenario: "sehat", episodeKering: true, jenisTanah: "Liat" },
];

// ─────────────────────────── Simulasi bacaan sensor ───────────────────────────

interface Bacaan {
  waktu: Date;
  kelembapanTanah: number;
  suhu: number;
  ph: number;
}

interface HasilSimulasi {
  bacaan: Bacaan[];
  siramRutin: Date[];
  siramRekomendasi: { dibuat: Date; dikerjakan: Date; kelembapan: number }[];
}

function simulasikan(cfg: (typeof LAHAN)[number]): HasilSimulasi {
  const total = HARI_RIWAYAT * 48;
  const akhir = cfg.skenario === "sensor-mati" ? total - 6 : total; // berhenti 3 jam lalu
  const hasil: HasilSimulasi = { bacaan: [], siramRutin: [], siramRekomendasi: [] };
  let kelembapan = antara(68, 76);
  let rek: { dibuat: Date; kelembapan: number; langkah: number } | null = null;

  for (let k = 0; k < akhir; k++) {
    const waktu = new Date(SEKARANG.getTime() - (total - 1 - k) * LANGKAH);
    const sisaJam = (SEKARANG.getTime() - waktu.getTime()) / JAM;
    const jamWib = (waktu.getUTCHours() + 7) % 24 + waktu.getUTCMinutes() / 60;
    const siang = Math.sin(((jamWib - 7) / 24) * 2 * Math.PI); // puncak sekitar 13.00

    const mengering = cfg.skenario === "mengering" && sisaJam <= 48;
    const episode = cfg.episodeKering === true && sisaJam <= 11.5 * 24 && sisaJam > 9 * 24;

    kelembapan -= 0.06 + Math.max(0, siang) * 0.03 + (mengering ? 0.2 : 0) + (episode ? 0.3 : 0);
    kelembapan = Math.max(kelembapan, 30);

    if (episode) {
      // Rekomendasi muncul saat kelembapan melewati batas; petani menyiram ±3 jam kemudian.
      if (!rek && kelembapan < AMBANG_KELEMBAPAN.min) rek = { dibuat: waktu, kelembapan: bulat(kelembapan), langkah: k };
      if (rek && k - rek.langkah >= 6) {
        hasil.siramRekomendasi.push({ dibuat: rek.dibuat, dikerjakan: waktu, kelembapan: rek.kelembapan });
        kelembapan = antara(75, 78);
        rek = null;
      }
    } else if (!mengering && kelembapan < 64) {
      kelembapan = antara(75, 78); // penyiraman rutin petani
      hasil.siramRutin.push(waktu);
    }

    let suhu = 26 + 5 * siang + antara(-0.6, 0.6);
    if (cfg.skenario === "panas" && sisaJam <= 6) suhu = antara(33.2, 34);

    let ph = 6.3 + antara(-0.08, 0.08);
    if (cfg.skenario === "ph-turun" && sisaJam <= 120) ph = 6.3 - (1 - sisaJam / 120) * 0.95 + antara(-0.03, 0.03);

    let nilaiKelembapan = bulat(kelembapan + antara(-0.5, 0.5));
    if (k % 487 === 200) nilaiKelembapan = 150; // gangguan sensor → harus ditandai tidak valid (NFR-25)

    hasil.bacaan.push({ waktu, kelembapanTanah: nilaiKelembapan, suhu: bulat(suhu), ph: bulat(ph, 2) });
  }
  return hasil;
}

// ─────────────────────────── Seed ───────────────────────────

async function bersihkan() {
  await prisma.notifikasi.deleteMany();
  await prisma.peringatanDini.deleteMany();
  await prisma.kegiatanBudidaya.deleteMany();
  await prisma.rekomendasi.deleteMany();
  await prisma.estimasiPanen.deleteMany();
  await prisma.realisasiPanen.deleteMany();
  await prisma.dataTanam.deleteMany();
  await prisma.kondisiLahan.deleteMany();
  await prisma.perangkatSensor.deleteMany();
  await prisma.lahan.deleteMany();
  await prisma.dataCuaca.deleteMany();
  await prisma.aturanRekomendasi.deleteMany();
  await prisma.ambangBatas.deleteMany();
  await prisma.faseTanam.deleteMany();
  await prisma.varietas.deleteMany();
  await prisma.komoditas.deleteMany();
  await prisma.kelompokTani.updateMany({ data: { ketuaId: null } });
  await prisma.user.deleteMany();
  await prisma.kelompokTani.deleteMany();
}

async function main() {
  console.log("Membersihkan database...");
  await bersihkan();
  const passwordHash = await bcrypt.hash(PASSWORD_DEMO, 10);

  // ── Kelompok & pengguna ──
  const kelompok: Record<string, string> = {};
  for (const k of KELOMPOK) {
    kelompok[k.kunci] = (await prisma.kelompokTani.create({ data: { nama: k.nama, desa: k.desa, wilayah: WILAYAH } })).id;
  }

  await prisma.user.create({ data: { email: "admin@agri.local", nama: "Admin Sistem", peran: "ADMIN", passwordHash } });
  await prisma.user.create({
    data: { email: "dinas@agri.local", nama: "Dinas Pertanian Kab. Contoh", peran: "DINAS", wilayah: WILAYAH, passwordHash },
  });
  const ketua = [
    { email: "ketua@agri.local", nama: "Slamet Riyadi", kelompok: "makmur", noHp: "081200000010" },
    { email: "ketua2@agri.local", nama: "Sri Wahyuni", kelompok: "rejeki", noHp: "081200000020" },
  ];
  for (const k of ketua) {
    const u = await prisma.user.create({
      data: { email: k.email, nama: k.nama, peran: "KETUA_KELOMPOK", kelompokId: kelompok[k.kelompok], noHp: k.noHp, passwordHash },
    });
    await prisma.kelompokTani.update({ where: { id: kelompok[k.kelompok] }, data: { ketuaId: u.id } });
  }
  const petani: Record<string, string> = {};
  for (const [i, p] of PETANI.entries()) {
    const u = await prisma.user.create({
      data: {
        email: p.email,
        nama: p.nama,
        peran: "PETANI",
        kelompokId: kelompok[p.kelompok],
        noHp: `08120000000${i + 1}`,
        alamat: `Desa ${KELOMPOK.find((k) => k.kunci === p.kelompok)!.desa}`,
        passwordHash,
      },
    });
    petani[p.kunci] = u.id;
  }

  // ── Komoditas, fase, ambang, aturan ──
  const komoditas = await prisma.komoditas.create({
    data: { nama: "Cabai Merah", varietas: { create: VARIETAS }, fase: { create: FASE } },
    include: { varietas: { orderBy: { nama: "asc" } } },
  });
  await prisma.ambangBatas.createMany({
    data: FASE.flatMap((f) => AMBANG.map((a) => ({ ...a, fase: f.nama, komoditasId: komoditas.id }))),
  });
  const SUMBER = "Contoh — validasi ke penyuluh";
  await prisma.aturanRekomendasi.createMany({
    data: [
      { jenis: "PUPUK", parameter: "PH", operator: "<", nilai: 5.5, tindakan: "Taburkan kapur dolomit di sekitar bedengan", dosis: "Sesuai anjuran penyuluh", sumber: SUMBER },
      { jenis: "PUPUK", parameter: "PH", operator: ">", nilai: 7.0, tindakan: "Gunakan pupuk bersifat asam (mis. ZA) pada pemupukan berikutnya", dosis: "Sesuai anjuran penyuluh", sumber: SUMBER },
      { jenis: "PUPUK", parameter: "PH", operator: "<", nilai: 5.8, fase: "BERBUAH", tindakan: "Tambahkan pupuk kalium (KCl) untuk mendukung pembuahan", dosis: "Sesuai anjuran penyuluh", sumber: SUMBER },
    ].map((a) => ({ ...a, komoditasId: komoditas.id })),
  });
  const aturan = (await prisma.aturanRekomendasi.findMany()).map<Aturan>((a) => ({
    ...a,
    jenis: a.jenis as Aturan["jenis"],
    parameter: a.parameter as Parameter,
    operator: a.operator as Aturan["operator"],
  }));

  // ── Lahan, sensor, tanam, riwayat ──
  let totalBacaan = 0;
  for (const [i, cfg] of LAHAN.entries()) {
    const kode = `SENSOR-${String(i + 1).padStart(3, "0")}`;
    const varietas = komoditas.varietas[cfg.varietas];
    const pemilikId = petani[cfg.pemilik];
    const sim = simulasikan(cfg);
    const terakhir = sim.bacaan[sim.bacaan.length - 1];

    const lahan = await prisma.lahan.create({
      data: {
        nama: cfg.nama,
        luasHa: cfg.luasHa,
        jenisTanah: cfg.jenisTanah,
        kodeWilayah: "31.71.03.1001", // contoh kode adm4 BMKG
        pemilikId,
        sensor: {
          create: {
            kode,
            apiKeyHash: sha256(`dev-key-${String(i + 1).padStart(3, "0")}`),
            terakhirAktif: terakhir.waktu,
            levelBaterai: Math.round(antara(45, 98)),
          },
        },
      },
      include: { sensor: true },
    });
    const sensorId = lahan.sensor[0].id;

    // Musim-musim sebelumnya (sudah panen) untuk data produktivitas.
    let ujung = new Date(SEKARANG.getTime() - cfg.hst * HARI);
    for (let m = 0; m < 3; m++) {
      const tanam = new Date(ujung.getTime() - (varietas.umurPanenHst + Math.round(antara(18, 35))) * HARI);
      const estimasi = estimasiTanggalPanen(tanam, varietas.umurPanenHst);
      const panen = new Date(estimasi.getTime() + Math.round(antara(-4, 7)) * HARI);
      await prisma.dataTanam.create({
        data: {
          lahanId: lahan.id,
          varietasId: varietas.id,
          tanggalTanam: tanam,
          luasTanamHa: cfg.luasHa,
          fase: "PANEN",
          status: "SELESAI",
          estimasi: { create: { tanggalEstimasi: estimasi } },
          realisasi: { create: { tanggalPanen: panen, hasilKg: Math.round(cfg.luasHa * antara(7200, 11800)) } },
        },
      });
      ujung = tanam;
    }

    // Musim berjalan.
    const tanggalTanam = new Date(SEKARANG.getTime() - cfg.hst * HARI);
    const fase = tentukanFase(hitungHst(tanggalTanam), FASE) ?? "VEGETATIF";
    const dataTanam = await prisma.dataTanam.create({
      data: {
        lahanId: lahan.id,
        varietasId: varietas.id,
        tanggalTanam,
        luasTanamHa: cfg.luasHa,
        fase,
        estimasi: { create: { tanggalEstimasi: estimasiTanggalPanen(tanggalTanam, varietas.umurPanenHst) } },
      },
    });

    // Riwayat sensor + validasi rentang fisik.
    const baris = sim.bacaan.map((b) => {
      const v = validasiRentangFisik(b);
      return {
        sensorId,
        lahanId: lahan.id,
        waktuCatat: b.waktu,
        diterimaPada: new Date(b.waktu.getTime() + 5_000),
        kelembapanTanah: b.kelembapanTanah,
        suhu: b.suhu,
        ph: b.ph,
        valid: v.valid,
        catatanValidasi: v.valid ? null : v.alasan.join("; "),
      };
    });
    for (let j = 0; j < baris.length; j += 2000) await prisma.kondisiLahan.createMany({ data: baris.slice(j, j + 2000) });
    totalBacaan += baris.length;

    // Peringatan dini dari riwayat: buka saat nilai keluar batas, tutup saat kembali normal (FR-12).
    const aktif = new Map<Parameter, { id: string; tingkat: string }>();
    for (const b of sim.bacaan) {
      if (!validasiRentangFisik(b).valid) continue;
      const pelanggaran = periksaAmbang(b, AMBANG);
      for (const p of pelanggaran) {
        const ada = aktif.get(p.parameter);
        if (!ada) {
          const baru = await prisma.peringatanDini.create({
            data: {
              lahanId: lahan.id,
              sensorId,
              parameter: p.parameter,
              nilai: p.nilai,
              batasMin: p.min,
              batasMaks: p.maks,
              tingkat: p.tingkat,
              pesan: pesanPeringatan(p),
              createdAt: b.waktu,
              notifikasi: {
                create: {
                  penerimaId: pemilikId,
                  kanal: "SIMULASI",
                  tujuan: `08120000000${PETANI.findIndex((x) => x.kunci === cfg.pemilik) + 1}`,
                  isi: `[${cfg.nama}] ${pesanPeringatan(p)}`,
                  status: "TERKIRIM",
                  dikirimPada: new Date(b.waktu.getTime() + MENIT),
                  createdAt: b.waktu,
                },
              },
            },
          });
          aktif.set(p.parameter, { id: baru.id, tingkat: p.tingkat });
        } else if (ada.tingkat === "WASPADA" && p.tingkat === "BAHAYA") {
          // Eskalasi: nilai makin jauh dari batas.
          await prisma.peringatanDini.update({
            where: { id: ada.id },
            data: { tingkat: "BAHAYA", nilai: p.nilai, pesan: pesanPeringatan(p) },
          });
          ada.tingkat = "BAHAYA";
        }
      }
      for (const [param, a] of aktif) {
        if (!pelanggaran.some((p) => p.parameter === param)) {
          await prisma.peringatanDini.update({ where: { id: a.id }, data: { status: "SELESAI", selesaiPada: b.waktu } });
          aktif.delete(param);
        }
      }
    }
    if (cfg.skenario === "sensor-mati") {
      await prisma.peringatanDini.create({
        data: {
          lahanId: lahan.id,
          sensorId,
          parameter: "SENSOR_OFFLINE",
          tingkat: "WASPADA",
          pesan: `Sensor ${kode} tidak mengirim data lebih dari 30 menit. Periksa baterai atau sinyal.`,
          createdAt: new Date(terakhir.waktu.getTime() + 30 * MENIT),
        },
      });
    }

    // Kegiatan budidaya: penyiraman rutin & pemupukan oleh petani.
    const kegiatan = sim.siramRutin
      .filter((w) => w >= tanggalTanam)
      .map((w) => ({ jenis: "SIRAM", tanggal: w, keterangan: "Penyiraman rutin", dataTanamId: dataTanam.id, dicatatOlehId: pemilikId }));
    for (const hari of [14, 35, 56]) {
      const t = new Date(tanggalTanam.getTime() + hari * HARI);
      if (t < SEKARANG) {
        kegiatan.push({ jenis: "PUPUK", tanggal: t, keterangan: "Pupuk susulan NPK", dataTanamId: dataTanam.id, dicatatOlehId: pemilikId });
      }
    }
    await prisma.kegiatanBudidaya.createMany({ data: kegiatan });

    // Rekomendasi historis yang ditindaklanjuti (episode kering).
    for (const e of sim.siramRekomendasi.filter((x) => x.dibuat >= tanggalTanam)) {
      const draf = rekomendasiPenyiraman(
        { kelembapanTanah: e.kelembapan, suhu: 27, ph: 6.3 },
        AMBANG_KELEMBAPAN,
        { curahHujanMm24j: 0 },
        e.dibuat,
      );
      if (!draf) continue;
      await prisma.rekomendasi.create({
        data: {
          ...draf,
          status: "DIKONFIRMASI",
          dataTanamId: dataTanam.id,
          createdAt: e.dibuat,
          kegiatan: {
            create: { jenis: "SIRAM", tanggal: e.dikerjakan, keterangan: draf.tindakan, dataTanamId: dataTanam.id, dicatatOlehId: pemilikId },
          },
        },
      });
    }

    // Rekomendasi saat ini dari bacaan valid terakhir (FR-15, FR-16).
    const kondisi = await prisma.kondisiLahan.findFirst({
      where: { lahanId: lahan.id, valid: true },
      orderBy: { waktuCatat: "desc" },
    });
    if (kondisi) {
      const sekarangDraf = [
        rekomendasiPenyiraman(kondisi, AMBANG_KELEMBAPAN, { curahHujanMm24j: 0 }, SEKARANG),
        ...rekomendasiPemupukan(kondisi, fase, aturan, SEKARANG),
      ].filter((d) => d !== null);
      for (const d of sekarangDraf) {
        await prisma.rekomendasi.create({ data: { ...d, dataTanamId: dataTanam.id, kondisiId: kondisi.id } });
      }
      // Rekomendasi siram yang lebih lama dan tidak ditindaklanjuti → kedaluwarsa.
      if (cfg.skenario === "mengering") {
        const lama = new Date(SEKARANG.getTime() - 20 * JAM);
        await prisma.rekomendasi.create({
          data: {
            jenis: "SIRAM",
            jadwal: lama,
            tindakan: "Siram lahan",
            alasan: "Kelembapan tanah 59.2% di bawah batas 60%.",
            prioritas: "SEDANG",
            status: "KEDALUWARSA",
            dataTanamId: dataTanam.id,
            createdAt: new Date(lama.getTime() - 2 * JAM),
          },
        });
      }
    }
    console.log(`  ✓ ${cfg.nama} (${kode}, ${cfg.skenario}): ${baris.length} bacaan`);
  }

  console.log(`\nSeed selesai: ${totalBacaan} bacaan sensor. Akun demo (password: ${PASSWORD_DEMO}):`);
  console.table([
    { email: "petani1@agri.local", peran: "PETANI (Budi, 2 lahan)" },
    { email: "petani2@agri.local", peran: "PETANI (Siti)" },
    { email: "ketua@agri.local", peran: "KETUA_KELOMPOK (Tani Makmur)" },
    { email: "dinas@agri.local", peran: "DINAS" },
    { email: "admin@agri.local", peran: "ADMIN" },
  ]);
  console.log("Sensor: SENSOR-001..007 dengan API key dev-key-001..007");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
