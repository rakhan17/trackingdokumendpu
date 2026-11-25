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
3. Salin `.env.example` menjadi `.env.local` dan isi Firebase Web App config.
4. Jalankan `npm run dev`.

Buat akun admin secara manual di Firebase Console > Authentication > Users > Add user. Tidak ada fitur sign-up di aplikasi.

## Firebase
Aktifkan Authentication > Email/Password dan Firestore. Jangan gunakan Firestore Test Mode untuk data nyata. Terapkan rules dari `firestore.rules` sebelum memasukkan data keuangan.

Lihat `docs/FIREBASE_SETUP.md` untuk panduan konfigurasi.
