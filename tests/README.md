# Pengujian

Jalankan: `npm test`

Pemetaan rencana pengujian fungsional (Bab IV 4.3) ke kode:

| ID | Fungsi | Dicakup oleh | Status |
|---|---|---|---|
| T-01 | Login | uji integrasi login | Sprint 1 |
| T-02 | Hak akses | `tests/lib/auth.test.ts` (aturan role) + middleware | Aturan siap, middleware Sprint 1 |
| T-03 | Data sensor | uji integrasi `POST /api/sensor/ingest` | Sprint 2 |
| T-04 | Validasi | `tests/lib/validation.test.ts` | Unit siap |
| T-05 | Peringatan | `tests/rules/alert.test.ts` + pengiriman notifikasi | Unit siap, notifikasi Sprint 3 |
| T-06 | Rekomendasi | `tests/rules/irigasi.test.ts`, `tests/rules/pemupukan.test.ts` | Unit siap |
| T-07 | Konfirmasi tindakan | uji integrasi rekomendasi → kegiatan | Sprint 4 |
| T-08 | Estimasi panen | `tests/rules/estimasi-panen.test.ts` | Unit siap |
| T-09 | Offline | `npm run simulasi -- --skenario offline` | Sprint 2 |
| T-10 | Laporan | uji unduh PDF/Excel | Sprint 5 |

Folder:
- `tests/rules/`: mesin aturan (fungsi murni, tanpa database)
- `tests/lib/`: validasi dan autentikasi
