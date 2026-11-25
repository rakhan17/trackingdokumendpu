# Setup Firebase

## 1. Buat / buka project
Firebase Console: https://console.firebase.google.com/
Pilih project `trackingdokumenpu`.

## 2. Daftarkan Web App
Project settings (ikon gear) > General > Your apps > Add app > Web. Jika sudah ada Web App, buka konfigurasi SDK-nya.

Salin konfigurasi ke `.env.local`. Nilai API key tersedia pada Firebase Web App config (field `apiKey`). Field ini adalah identifier konfigurasi aplikasi web, bukan password admin. Jangan pernah memasukkan service-account private key ke frontend.

## 3. Aktifkan login
Authentication > Sign-in method > Email/Password > Enable.

## 4. Buat admin secara manual
Authentication > Users > Add user. Masukkan email dan password admin. Aplikasi tidak memiliki tombol register.

## 5. Firestore
Build > Firestore Database. Jika database dibuat dalam Test Mode, rules bisa terbuka sementara. Sebelum memasukkan data nyata, buka Firestore > Rules, salin isi `firestore.rules`, lalu Publish.

## 6. Jalankan lokal
```bash
npm install
cp .env.example .env.local
npm run dev
```
Isi API key dan config lain di `.env.local`, lalu restart Vite.

## Catatan keamanan
Rules pada starter ini mengizinkan semua akun Firebase Authentication yang berhasil login membaca/menulis data. Jika hanya admin yang boleh mengakses, buat custom claim admin atau allowlist UID dan ubah rules. Untuk penggunaan kantor, sebaiknya batasi user dengan allowlist UID.
