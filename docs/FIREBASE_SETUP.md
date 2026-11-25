# Setup Firebase

## 1. Buka project
Firebase Console: https://console.firebase.google.com/
Pilih project `trackingdokumenpu`.

## 2. Konfigurasi Web App
Project settings (ikon gear) > General > Your apps > Web. Salin konfigurasi ke `.env.local` bila menjalankan aplikasi secara lokal. Jangan pernah memasukkan service-account private key ke frontend.

## 3. Aktifkan login
Authentication > Sign-in method > Email/Password > Enable.

## 4. Buat akun pengguna secara manual
Aplikasi menampilkan login **username dan password**, tetapi menggunakan Firebase Email/Password secara internal. Username dipetakan menjadi alamat email dengan format:

`<username>@trackingdokumenpu.firebaseapp.com`

Untuk akun yang diminta, buat user berikut melalui Authentication > Users > Add user:

- Email internal: `keudpu2026@trackingdokumenpu.firebaseapp.com`
- Password: `keudpu2026`

Pengguna tetap login di aplikasi dengan:
- Username: `keudpu2026`
- Password: `keudpu2026`

Jangan membuat akun dengan email lain jika ingin login memakai username tersebut. Tidak ada fitur sign-up publik.

## 5. Firestore
Build > Firestore Database. Jika database dibuat dalam Test Mode, rules bisa terbuka sementara. Sebelum memasukkan data nyata, buka Firestore > Rules, salin isi `firestore.rules`, lalu Publish.

## 6. Jalankan lokal
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Catatan keamanan
Rules pada starter ini mengizinkan semua akun Firebase Authentication yang berhasil login membaca/menulis data. Jika hanya admin yang boleh mengakses, buat custom claim admin atau allowlist UID dan ubah rules. Untuk penggunaan kantor, sebaiknya batasi user dengan allowlist UID.
