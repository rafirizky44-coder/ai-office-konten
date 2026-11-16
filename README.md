# AI Office — Konten Cuan Digital (Starter v0.1)

Paket ini adalah fondasi awal dashboard AI Office.

## Isi paket
- `index.html` — dashboard web responsif, mode demo lokal.
- `supabase-schema.sql` — rancangan database Supabase dengan Row Level Security.
- `README.md` — panduan pemasangan dan batasan versi awal.

## Fitur yang sudah ada di dashboard demo
- Dashboard ringkasan.
- Struktur delapan peran agen AI.
- Manajemen ide dan konten.
- Status workflow: ide, draft, review, disetujui, terjadwal, terpublikasi, revisi.
- Gerbang persetujuan owner.
- Kalender publikasi contoh.
- Rancangan workflow otomatisasi.
- Pengaturan identitas bisnis lokal.

Data demo disimpan di `localStorage` browser. Data tidak tersinkron antardevice dan belum memakai login/database. Ini sengaja dibuat sebagai prototipe UI yang dapat diuji sebelum backend dihubungkan.

## Menjalankan lokal
1. Ekstrak ZIP.
2. Buka `index.html` di browser modern.
3. Tambah konten, ubah status, dan uji alur persetujuan.
4. Data demo tersimpan pada browser/perangkat yang sama.

## Deploy ke GitHub Pages
1. Buat repository GitHub baru, misalnya `ai-office-konten-cuan`.
2. Upload `index.html` ke root repository.
3. Aktifkan Settings → Pages → Deploy from a branch → `main` → `/root`.
4. Buka URL Pages yang diberikan GitHub.

Jangan mengunggah file `.env`, token API, service role key, atau kredensial sosial ke repository publik.

## Menyiapkan Supabase
1. Buat project Supabase.
2. Buka SQL Editor.
3. Jalankan `supabase-schema.sql`.
4. Aktifkan Authentication (email/password atau metode yang dipilih).
5. Buat Storage bucket privat, misalnya `content-assets`.
6. Tambahkan kebijakan Storage agar hanya owner workspace yang dapat mengakses file.
7. Hubungkan dashboard ke Supabase Auth dan tabel setelah konfigurasi URL serta anon/publishable key dilakukan.

`anon`/publishable key dapat digunakan di frontend dengan RLS yang benar. `service_role` key tidak boleh digunakan di frontend.

## Arsitektur integrasi tahap berikutnya
- Dashboard: GitHub Pages.
- Auth/database/storage: Supabase.
- Orkestrasi: Make atau n8n.
- Model AI: OpenAI API melalui backend.
- Desain/video: Canva/CapCut dan/atau layanan kreatif yang memiliki API yang sesuai.
- Instagram: Meta Graph API untuk akun profesional yang memenuhi persyaratan.
- TikTok: API resmi yang tersedia dan disetujui untuk aplikasi/akun terkait.

## Aturan approval wajib
Publisher backend wajib menolak publikasi kecuali:
- `content_items.status = 'approved'`
- `content_items.approval_required = true`
- `content_items.approved_at` terisi
- platform/account tujuan valid dan telah diotorisasi
- aset dan caption lolos validasi.

Jangan menganggap tombol "Setujui" pada prototipe lokal sebagai persetujuan backend yang aman. Pengamanan final harus diterapkan pada server.

## Workflow yang perlu dibangun
1. Trigger: ide konten baru / jadwal batch mingguan.
2. Research agent menghasilkan brief.
3. Copywriter menghasilkan hook, skrip, caption, CTA.
4. Creative workflow menghasilkan aset dan menyimpan ke Storage.
5. QA memeriksa klaim, lisensi, brand voice, hak cipta, dan format.
6. Konten masuk status `review`.
7. Owner menyetujui atau meminta revisi.
8. Setelah approval, scheduler membuat `publish_jobs`.
9. Publisher mengirim ke API platform dan menyimpan response.
10. Analytics mengambil metrik berkala dan membuat laporan.

## Catatan produk
Produk utama: `7500+ Video Affiliate`. Akses produk melalui Google Drive. Hak reseller/MRR harus mengikuti dokumen lisensi asli. Jangan mengiklankan hak penggunaan ulang, hak mengedit, hak distribusi, atau klaim pendapatan yang tidak dinyatakan secara eksplisit dalam lisensi.


## Frontend Supabase integration (v0.2)

- `index.html` now loads `app.js` as an ES module and displays an email/password Auth gate.
- `app.js` uses the project URL and publishable key supplied by the owner. The publishable key is intended for browser use; never add a service-role/secret key.
- Content CRUD uses `public.workspaces` and `public.content_items`; the owner workspace is created on first sign-in.
- Approval writes `status=approved`, `approved_by`, `approved_at`, and an `approval_events` record. Approval does not publish content.
- Optional media uploads go to the private `content-assets` bucket and create `content_assets` rows.
- Realtime refreshes the content list when rows in the current workspace change.

Before deploying, run `supabase-frontend-setup.sql` in the Supabase SQL Editor after the base schema, verify the Storage policies and private `content-assets` bucket, and configure Auth Site URL + Redirect URL to `https://rafirizky44-coder.github.io/ai-office-konten/`.

This frontend is a first integration pass. It does not yet connect AI providers, Google Drive, Instagram, TikTok, or an automated publisher. Production publishing must be enforced by a trusted backend that verifies approval.
