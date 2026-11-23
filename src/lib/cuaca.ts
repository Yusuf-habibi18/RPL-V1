// FR-09: data cuaca. Default memakai data dummy; set CUACA_MODE="bmkg" untuk API BMKG.

export interface RingkasanCuaca {
  kodeWilayah: string;
  waktu: Date;
  suhu: number | null;
  kelembapanUdara: number | null;
  /** Total prakiraan curah hujan 24 jam ke depan (mm). */
  curahHujanMm24j: number;
  deskripsi: string;
  sumber: "BMKG" | "DUMMY";
}

const BMKG_URL = "https://api.bmkg.go.id/publik/prakiraan-cuaca";

export async function ambilCuaca(kodeWilayah: string): Promise<RingkasanCuaca> {
  if ((process.env.CUACA_MODE ?? "dummy") !== "bmkg") return cuacaDummy(kodeWilayah);

  const res = await fetch(`${BMKG_URL}?adm4=${encodeURIComponent(kodeWilayah)}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`BMKG merespons HTTP ${res.status}`);
  return parseBmkg(kodeWilayah, await res.json());
}

function cuacaDummy(kodeWilayah: string): RingkasanCuaca {
  return {
    kodeWilayah,
    waktu: new Date(),
    suhu: 28,
    kelembapanUdara: 75,
    curahHujanMm24j: 0,
    deskripsi: "Cerah berawan (data dummy)",
    sumber: "DUMMY",
  };
}

interface EntriBmkg {
  local_datetime?: string;
  t?: number; // suhu °C
  hu?: number; // kelembapan udara %
  tp?: number; // curah hujan mm
  weather_desc?: string;
}

/**
 * TODO Sprint 2: cocokkan dengan respons BMKG terbaru. Asumsi saat ini:
 * data[0].cuaca adalah array per hari berisi entri per 3 jam.
 */
function parseBmkg(kodeWilayah: string, json: unknown): RingkasanCuaca {
  const hari = (json as { data?: { cuaca?: EntriBmkg[][] }[] }).data?.[0]?.cuaca ?? [];
  const entri = hari.flat();
  if (entri.length === 0) throw new Error("Format respons BMKG tidak dikenali");

  const sekarang = entri[0];
  const hujan24j = entri.slice(0, 8).reduce((total, e) => total + (e.tp ?? 0), 0); // 8 × 3 jam

  return {
    kodeWilayah,
    waktu: sekarang.local_datetime ? new Date(sekarang.local_datetime) : new Date(),
    suhu: sekarang.t ?? null,
    kelembapanUdara: sekarang.hu ?? null,
    curahHujanMm24j: Math.round(hujan24j * 10) / 10,
    deskripsi: sekarang.weather_desc ?? "-",
    sumber: "BMKG",
  };
}
