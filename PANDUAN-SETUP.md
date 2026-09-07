# Panduan Setup — PantauSiswa (split front + back) + XAMPP

Panduan menjalankan project dari nol di komputer baru (Windows + XAMPP).

Arsitektur: `front` (Next.js, port 3000) → proxy `/api/be/*` → `back`
(NestJS, port 4000) → MySQL XAMPP (database `sysch`).

## 1. Instal yang dibutuhkan

1. **XAMPP** (yang penting MySQL/MariaDB) — https://www.apachefriends.org
2. **Node.js 20 LTS** atau lebih baru — https://nodejs.org
3. **Git** — https://git-scm.com

```powershell
node --version   # minimal v20
npm --version
```

## 2. Nyalakan MySQL + buat database

1. XAMPP Control Panel → **Start** MySQL.
2. Buat database `sysch`:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS sysch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

> Kalau root MySQL ada password, sesuaikan `DATABASE_URL` di `back/.env`.

## 3. Backend (`sysch/back`)

```powershell
cd sysch\back
copy .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
npm run start:dev
```

Tunggu `🚀 PantauSiswa API running at http://localhost:4000/api`.

Isi penting `.env`: `DATABASE_URL`, `JWT_SECRET` (acak, lihat bawah),
`PORT=4000`, `CORS_ORIGIN="http://localhost:3000"`.

Generate secret baru (wajib beda tiap environment):

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 4. Frontend (`sysch/front`, terminal baru)

```powershell
cd sysch\front
copy .env.example .env
npm install
npm run dev
```

Isi `.env`: `NEXT_PUBLIC_API_URL="http://localhost:4000/api"` dan
`JWT_SECRET` — **sama persis** dengan `back/.env` (dipakai middleware +
cookie sesi). Buka http://localhost:3000/login.

> Setiap ubah `.env` → restart dev server-nya. Ganti `JWT_SECRET` →
> semua user harus login ulang.

## 5. Akun seed (semua password `password123`)

| Peran | Email |
|---|---|
| Admin | `admin@sysch.id` |
| Guru | `budi@sysch.id`, `sari@sysch.id` |
| Siswa | `fauzi@student.sysch.id`, `rina@student.sysch.id`, `dimas@student.sysch.id`, `sinta@student.sysch.id`, `andre@student.sysch.id` |
| Sekretaris | `sekretaris.mipa1@sysch.id`, `sekretaris.ips2@sysch.id` |

Akun impor Excel / manual: password default `password123`.

## 6. Cek data

* phpMyAdmin: http://localhost/phpmyadmin → database `sysch` (perlu Apache jalan).
* Banner kuning "Backend tidak terjangkau" di dashboard = back mati / salah URL.

---

## Troubleshooting

| Gejala | Solusi |
|---|---|
| `Can't reach database` | MySQL belum Start. |
| `Unknown database 'sysch'` | Ulangi langkah 2. |
| `Access denied for user 'root'` | Sesuaikan password di `DATABASE_URL`. |
| Login gagal setelah ganti secret | Wajar — login ulang; restart kedua service. |
| `EPERM ... query_engine` saat generate | Proses node ganda mengunci file. Matikan backend (`Ctrl+C`), ulangi. |
| Port 3000/4000 dipakai | Matikan proses lama. Cek: `Get-NetTCPConnection -LocalPort 3000 -State Listen`. |
| Dashboard redirect ke login terus | Cookie sesi hilang/kedaluwarsa → login ulang. |
