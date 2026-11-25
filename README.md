# Tracking Dokumen Keuangan DPU 2026

Aplikasi tracking dokumen keuangan DPU berbasis React, TypeScript, Vite, Tailwind CSS, Firebase Authentication, Firestore, dan Fortune Sheet.

## Fitur
- Login menggunakan username dan password (Firebase Email/Password di belakang layar), tanpa registrasi publik.
- Input 1: tracking SPP, SPM, SP2D.
- Input 2: register transaksi SPM.
- Rekap otomatis berdasarkan Nomor SPM.
- Realtime sync Firestore.
- Nomor dokumen diperlakukan sebagai **teks** agar nol di depan dan digit panjang tetap utuh.
- Search, filter, export CSV, dan print/PDF.

## Setup
1. Install Node.js 20+.
2. Jalankan `npm install`.
3. Salin `.env.example` menjadi `.env.local`. Konfigurasi Web App Firebase project `trackingdokumenpu` sudah dicantumkan; jangan pernah menambahkan service-account private key ke frontend.
4. Jalankan `npm run dev`.

Buat akun pengguna secara manual di Firebase Console > Authentication > Users > Add user. Username dipetakan secara internal menjadi `<username>@trackingdokumenpu.firebaseapp.com`. Contoh akun yang diminta: username `keudpu2026` dan password `keudpu2026`, sehingga email internal Firebase yang harus dibuat adalah `keudpu2026@trackingdokumenpu.firebaseapp.com`. Tidak ada fitur sign-up publik.

## Firebase
Aktifkan Authentication > Email/Password dan Firestore. Jangan gunakan Firestore Test Mode untuk data nyata. Terapkan rules dari `firestore.rules` sebelum memasukkan data keuangan.

Lihat `docs/FIREBASE_SETUP.md` untuk panduan konfigurasi.

## Deploy ke Vercel
1. Import repository ini ke Vercel. Framework preset: Vite; build command: `npm run build`; output directory: `dist`.
2. Tambahkan environment variables dari `.env.example` ke Vercel Project Settings → Environment Variables (Production, Preview, Development sesuai kebutuhan).
3. Deploy. `vercel.json` mengatur fallback SPA agar route `/input1`, `/input2`, dan `/output` tidak menghasilkan 404 saat direfresh.
4. Pastikan domain deployment tercantum di Firebase Authentication → Settings → Authorized domains.
