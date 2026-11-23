/**
 * Simulasi sensor IoT: mengirim data ke POST /api/sensor/ingest (Bab IV 4.2).
 *
 * Contoh:
 *   npm run simulasi -- --skenario normal
 *   npm run simulasi -- --skenario kering --jumlah 12 --interval 2
 *   npm run simulasi -- --skenario offline --jumlah 6
 *
 * Opsi:
 *   --skenario  normal | kering | ph-rendah | rusak | mati | offline   (default: normal)
 *   --sensor    kode sensor        (default: SENSOR-001, sesuai seed)
 *   --kunci     API key sensor     (default: dev-key-001, sesuai seed)
 *   --jumlah    banyak bacaan      (default: 6)
 *   --interval  jeda antar kiriman dalam detik (default: 2)
 */

const SKENARIO = ["normal", "kering", "ph-rendah", "rusak", "mati", "offline"] as const;
type Skenario = (typeof SKENARIO)[number];

function ambilArg(nama: string, bawaan: string): string {
  const i = process.argv.indexOf(`--${nama}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : bawaan;
}

const BASE_URL = process.env.SIMULASI_URL ?? "http://localhost:3000";
const skenario = ambilArg("skenario", "normal") as Skenario;
const kodeSensor = ambilArg("sensor", "SENSOR-001");
const kunci = ambilArg("kunci", "dev-key-001");
const jumlah = Math.max(1, Number(ambilArg("jumlah", "6")));
const interval = Math.max(0, Number(ambilArg("interval", "2")));

interface Bacaan {
  kodeSensor: string;
  waktuCatat: string;
  kelembapanTanah: number;
  suhu: number;
  ph: number;
  levelBaterai: number;
}

const bulat = (n: number) => Math.round(n * 10) / 10;
const acak = (min: number, maks: number) => bulat(min + Math.random() * (maks - min));
const tunggu = (ms: number) => new Promise((r) => setTimeout(r, ms));

function buatBacaan(jenis: Skenario, langkah: number, total: number, waktu: Date): Bacaan {
  const dasar: Bacaan = {
    kodeSensor,
    waktuCatat: waktu.toISOString(),
    kelembapanTanah: acak(65, 75),
    suhu: acak(25, 29),
    ph: acak(6.0, 6.5),
    levelBaterai: 90,
  };
  switch (jenis) {
    case "kering": {
      // Kelembapan turun bertahap dari 62% ke 35%.
      const t = total > 1 ? langkah / (total - 1) : 1;
      return { ...dasar, kelembapanTanah: bulat(62 - t * 27) };
    }
    case "ph-rendah":
      return { ...dasar, ph: acak(4.8, 5.2) };
    case "rusak":
      // Di luar rentang fisik → harus ditandai tidak valid (T-04).
      return langkah % 2 === 0 ? { ...dasar, kelembapanTanah: 150 } : { ...dasar, ph: 20 };
    default:
      return dasar;
  }
}

async function kirim(payload: Bacaan | Bacaan[]) {
  const res = await fetch(`${BASE_URL}/api/sensor/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": kunci },
    body: JSON.stringify(payload),
  });
  console.log(`  → HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
}

async function main() {
  if (!SKENARIO.includes(skenario)) {
    throw new Error(`Skenario "${skenario}" tidak dikenal. Pilih: ${SKENARIO.join(", ")}`);
  }
  console.log(`Simulasi "${skenario}" → ${BASE_URL} (sensor ${kodeSensor})`);

  if (skenario === "mati") {
    // Kirim satu bacaan bertanggal 45 menit lalu lalu berhenti → sensor harus ditandai offline (NFR-13).
    await kirim(buatBacaan("normal", 0, 1, new Date(Date.now() - 45 * 60_000)));
    console.log("Sensor berhenti mengirim. Status harus menjadi OFFLINE (> 30 menit).");
    return;
  }

  if (skenario === "offline") {
    // Bacaan tiap 5 menit ditampung selama sinyal putus, lalu dikirim sekaligus.
    // Antrean dikirim dua kali: data tidak boleh hilang maupun ganda (NFR-11, T-09).
    const mulai = Date.now() - jumlah * 5 * 60_000;
    const antrean = Array.from({ length: jumlah }, (_, i) =>
      buatBacaan("normal", i, jumlah, new Date(mulai + i * 5 * 60_000)),
    );
    console.log(`Sinyal pulih: mengirim ${jumlah} bacaan tertampung...`);
    await kirim(antrean);
    console.log("Mengirim ulang antrean yang sama (tidak boleh menggandakan data)...");
    await kirim(antrean);
    return;
  }

  for (let i = 0; i < jumlah; i++) {
    const b = buatBacaan(skenario, i, jumlah, new Date());
    console.log(`[${i + 1}/${jumlah}] kelembapan=${b.kelembapanTanah}% suhu=${b.suhu}°C pH=${b.ph}`);
    await kirim(b);
    if (i < jumlah - 1) await tunggu(interval * 1000);
  }
}

main().catch((e: unknown) => {
  const pesan = e instanceof Error ? e.message : String(e);
  console.error(`Gagal: ${pesan}`);
  if (pesan.includes("fetch failed")) console.error(`Pastikan aplikasi berjalan (npm run dev) di ${BASE_URL}`);
  process.exit(1);
});
