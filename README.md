# Tracking Dokumen Keuangan DPU 2026

Aplikasi tracking dokumen keuangan DPU berbasis React, TypeScript, Vite, Tailwind CSS, Firebase Authentication, Firestore, dan Fortune Sheet.

## Fitur
- Login Firebase Email/Password, tanpa registrasi publik.
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

Buat akun admin secara manual di Firebase Console > Authentication > Users > Add user. Tidak ada fitur sign-up di aplikasi.

## Firebase
Aktifkan Authentication > Email/Password dan Firestore. Jangan gunakan Firestore Test Mode untuk data nyata. Terapkan rules dari `firestore.rules` sebelum memasukkan data keuangan.

Lihat `docs/FIREBASE_SETUP.md` untuk panduan konfigurasi.
\n## Deploy ke Vercel\n1. Import repository ini ke Vercel. Framework preset: Vite; build command: `npm run build`; output directory: `dist`.\n2. Tambahkan environment variables dari `.env.example` ke Vercel Project Settings → Environment Variables (Production, Preview, Development sesuai kebutuhan).\n3. Deploy. `vercel.json` mengatur fallback SPA agar route `/input1`, `/input2`, dan `/output` tidak menghasilkan 404 saat direfresh.\n4. Pastikan domain deployment tercantum di Firebase Authentication → Settings → Authorized domains.\n