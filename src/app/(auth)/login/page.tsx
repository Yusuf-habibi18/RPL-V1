import { BellRing, Droplets, Sprout } from "lucide-react";
import { FieldBackdrop } from "@/components/layout/FieldBackdrop";
import { Logo } from "@/components/layout/Logo";
import { LeafHologram } from "@/components/viz/LeafHologram";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Masuk" };

const FITUR = [
  { ikon: BellRing, judul: "Peringatan dini", teks: "Kabar langsung saat tanah terlalu kering, pH berubah, atau sensor terputus." },
  { ikon: Droplets, judul: "Rekomendasi siram & pupuk", teks: "Saran tindakan dari data sensor dan pedoman penyuluh." },
  { ikon: Sprout, judul: "Estimasi panen", teks: "Pantau umur tanaman dan perkiraan tanggal panen." },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <main className="relative grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <FieldBackdrop />

      {/* Panel identitas (desktop) */}
      <section className="relative hidden overflow-hidden border-r border-line bg-gradient-to-br from-[#0d1c38] via-bg to-bg p-12 lg:flex lg:flex-col">
        <Logo />
        <div className="relative my-auto max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">Smart Farming Intelligence</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight">
            Data sensor lahan menjadi <span className="bg-gradient-to-r from-primary to-cyan bg-clip-text text-transparent">tindakan nyata</span> di
            kebun Anda.
          </h1>
          <ul className="mt-10 space-y-5">
            {FITUR.map(({ ikon: Ikon, judul, teks }) => (
              <li key={judul} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-cyan ring-1 ring-primary/25">
                  <Ikon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold">{judul}</span>
                  <span className="block text-sm text-muted">{teks}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <LeafHologram className="pointer-events-none absolute -bottom-10 -right-16 h-[420px] w-[420px] opacity-80" />
        <p className="relative text-xs text-muted">Proyek Rekayasa Perangkat Lunak · Kelompok 2</p>
      </section>

      {/* Form */}
      <section className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <div className="panel corner-ticks rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">Masuk</h2>
            <p className="mb-6 mt-1 text-sm text-muted">Gunakan akun yang diberikan admin atau kelompok tani Anda.</p>
            <LoginForm tujuan={next} tampilkanDemo={process.env.NODE_ENV !== "production" || process.env.TAMPILKAN_AKUN_DEMO === "1"} />
          </div>
          <p className="mt-6 text-center text-xs text-muted">Lupa kata sandi? Hubungi admin sistem atau ketua kelompok tani.</p>
        </div>
      </section>
    </main>
  );
}
