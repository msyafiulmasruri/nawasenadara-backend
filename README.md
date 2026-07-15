# Nawasena Dara Backend API

Backend Node.js/Express untuk Nawasena Dara, berisi sistem autentikasi
lengkap: JWT access + refresh token (dengan rotasi & reuse detection),
login email/password, Google OAuth, dan lupa/reset password lewat
email (Nodemailer).

Polanya meniru struktur backend DepreScan (controller - repository -
routes per-service, error handling terpusat, response format
konsisten), dengan tambahan refresh token yang belum ada di referensi.

## Tech Stack

- Node.js + Express.js
- PostgreSQL (`pg` + `node-pg-migrate`)
- JWT (`jsonwebtoken`) - access & refresh token dengan secret terpisah
- Google OAuth (`google-auth-library`) - verifikasi ID token
- Nodemailer (SMTP) - email reset password
- Joi - validasi payload
- bcryptjs - hash password

## Setup

```bash
npm install
cp .env.example .env
# isi .env sesuai environment kamu (lihat komentar di dalamnya)

# jalankan migrasi (butuh PostgreSQL sudah menyala & database sudah dibuat)
npm run migrate:up

npm run dev   # development (nodemon)
npm start     # production
```

## Struktur

```
src/
  config/db.js                     # koneksi PostgreSQL (pg Pool)
  security/token-manager.js        # generate/verify JWT, hash refresh token
  middlewares/
    auth.js                        # authenticate (access token) + authorize (role)
    validate.js                    # validasi body/query pakai Joi
    error.js                       # error handler global
  exceptions/                      # ClientError & turunannya (401/403/404/400)
  services/
    authentications/
      controllers/                 # register, login, google, refresh, logout, reset password
      repositories/                # query refresh_tokens & password_reset_tokens
      routes/
      validator/
    users/
      controllers/                 # getMe, updateMe
      repositories/                # query tabel users
      validator/
    email/email-service.js         # kirim email reset password via Nodemailer
  routes/index.js                  # gabungan semua route service
  server/index.js                  # setup Express app (CORS, helmet, rate limit)
  server.js                        # entry point + retry koneksi DB
migrations/                        # node-pg-migrate - users, refresh_tokens, password_reset_tokens
```

## Alur Refresh Token

1. **Login/Register/Google** - server generate **access token** (15
   menit, dikirim di body response, disimpan client di memori/state)
   dan **refresh token** (30 hari, dikirim lewat cookie `httpOnly`,
   tidak bisa dibaca JavaScript di browser).
2. Refresh token **tidak disimpan mentah** di database - hanya hash
   SHA-256-nya (tabel `refresh_tokens`), supaya kalau database bocor
   token asli tetap tidak bisa dipakai ulang.
3. Saat access token kedaluwarsa (401), client memanggil
   `POST /api/auth/refresh` (cookie refresh token otomatis ikut
   terkirim browser) - server **merotasi** token: refresh token lama
   ditandai `revoked_at`, refresh token baru dibuat & disimpan, access
   token baru dikembalikan.
4. Kalau ada yang mencoba memakai refresh token yang **sudah pernah
   dirotasi/di-revoke** (indikasi token dicuri), server langsung
   mencabut **semua** sesi milik user itu (reuse detection) dan
   memaksa login ulang.
5. **Logout** mencabut refresh token yang sedang dipakai. Ganti
   password lewat reset-password juga otomatis mencabut semua sesi
   lama di semua perangkat.

## Kontrak Endpoint

Semua response berbentuk `{ status, message, data }` (sukses) atau
`{ status: 'error', message }` (gagal).

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/auth/register` | - | `{ name, email, password, role? }` - `role` opsional: `siswa` (default) / `guru_bk` / `orang_tua` |
| POST | `/api/auth/login` | - | `{ email, password }` |
| POST | `/api/auth/google` | - | `{ credential, role? }` - `credential` = ID token dari Google Sign-In |
| POST | `/api/auth/refresh` | cookie refresh token | Tukar refresh token dengan access token baru |
| POST | `/api/auth/logout` | cookie refresh token | Cabut sesi saat ini |
| GET | `/api/auth/me` | Bearer access token | Profil user login |
| PUT | `/api/auth/me` | Bearer access token | `{ name }` |
| POST | `/api/auth/forgot-password` | - | `{ email }` - kirim email link reset |
| GET | `/api/auth/reset-password/verify?token=` | - | Cek token reset masih valid |
| POST | `/api/auth/reset-password` | - | `{ token, password }` |

Endpoint yang butuh access token kirim header:
`Authorization: Bearer <access_token>`.

## Integrasi Google OAuth (Frontend)

Pakai `@react-oauth/google` dengan flow **`login`** (bukan
`implicit`), supaya library mengembalikan `credential` (ID token),
sesuai yang divalidasi endpoint `/api/auth/google` di sini:

```jsx
import { GoogleLogin } from '@react-oauth/google';

<GoogleLogin
  onSuccess={(res) => {
    // res.credential -> kirim ke POST /api/auth/google
  }}
/>
```

## Catatan Keamanan

- Refresh token WAJIB dikirim lewat cookie `httpOnly` + `secure` (di
  production) - jangan simpan refresh token di `localStorage`.
- Access token boleh disimpan di memori (state React/Context), hindari
  `localStorage` kalau memungkinkan untuk mengurangi risiko XSS.
- `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` **harus berbeda**.
- Untuk SMTP Gmail, wajib pakai **App Password** (2FA aktif), bukan
  password akun Google biasa.
