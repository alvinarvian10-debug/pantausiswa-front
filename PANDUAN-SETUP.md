# Panduan Setup — PantauSiswa + XAMPP

Panduan untuk menjalankan project ini dari nol di komputer baru (Windows + XAMPP).

## 1. Instal yang dibutuhkan

1. **XAMPP** (pakai PHP versi berapa pun, yang penting ada MySQL/MariaDB) — https://www.apachefriends.org
2. **Node.js versi 20 LTS** (atau lebih baru) — https://nodejs.org
3. **Git** — https://git-scm.com

Cek instalasi:

```powershell
node --version   # minimal v20
npm --version
```

## 2. Nyalakan MySQL di XAMPP

1. Buka **XAMPP Control Panel** → klik **Start** pada baris **MySQL** (tombol berubah hijau).
2. Apache **tidak wajib** (hanya perlu kalau mau buka phpMyAdmin).

## 3. Buat database

Buka shell MySQL XAMPP lalu jalankan:

```sql
CREATE DATABASE `pantausiswa-db`;
```

Cara cepat via PowerShell (sesuaikan path XAMPP bila beda):

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS \`pantausiswa-db\`;"
```

> Kalau user `root` MySQL-mu **ada password** (misal `rahasia`), catat — dipakai di langkah 5.

## 4. Clone project + instal dependency

```powershell
git clone <URL-REPO-KAMU>
cd front
npm install
```

## 5. Buat file `.env`

Salin template lalu isi:

```powershell
copy .env.example .env
```

Isi `.env`:

```env
DATABASE_URL="mysql://root:@localhost:3306/pantausiswa-db"
SESSION_SECRET="<acak 64 karakter>"
SETUP_KEY="<acak 48 karakter>"
```

* `DATABASE_URL` — kalau root ada password: `mysql://root:rahasia@localhost:3306/pantausiswa-db`. Kalau nama DB beda, sesuaikan bagian akhirnya.
* Generate kunci acak:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

> `.env` **jangan pernah di-commit** (sudah masuk `.gitignore`).

## 6. Buat tabel database

```powershell
npx prisma db push
```

Perintah ini membuat seluruh tabel (`user`, `complaint`, `leaverequest`, `attendance`, `assignment`, `submission`, `facility`, `loan`, `schoolclass`, `student`, `teacher`) sekaligus generate Prisma Client. Tunggu sampai muncul `Your database is now in sync`.

## 7. Jalankan aplikasi + seeding akun

```powershell
npm run dev
```

Di terminal **baru** (biarkan `npm run dev` jalan), seeding 5 akun awal:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/seed" -Method Post -ContentType "application/json" -Body '{"key":"ISI_SETUP_KEY_MU"}'
```

Berhasil bila respons berisi `admin`, `guru`, `siswa`, `sekretaris.xipa1`, `sekretaris.xipa2`.

> Alternatif Git Bash / curl:
> `curl -X POST http://localhost:3000/api/auth/seed -H "Content-Type: application/json" -d '{"key":"ISI_SETUP_KEY_MU"}'`

## 8. Login

Buka http://localhost:3000/login — **pilih peran dulu**, baru isi akun:

| Peran | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Guru | `guru` | `guru123` |
| Siswa | `siswa` | `siswa123` |
| Sekretaris X IPA 1 | `sekretaris.xipa1` | `sekretaris123` |
| Sekretaris X IPA 2 | `sekretaris.xipa2` | `sekretaris123` |

⚠️ **Akun di atas hanya untuk demo. Ganti passwordnya** setelah login (atau via database) sebelum dipakai serius.

## 9. Bereskan sisa setup (disarankan)

1. Hapus folder `app/api/auth/seed/`, lalu hapus baris `SETUP_KEY` dari `.env`.
2. Restart `npm run dev`.

## 10. Cek data masuk database

* phpMyAdmin: http://localhost/phpmyadmin → database `pantausiswa-db` (perlu Apache jalan), atau
* `npx prisma studio` (UI database di browser).

---

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| `Can't reach database` / `Connection refused` | MySQL XAMPP belum di-Start. Nyalakan di XAMPP Control Panel. |
| `Access denied for user 'root'` | Root ada password → sesuaikan `DATABASE_URL`. Atau reset password root via phpMyAdmin. |
| `Unknown database 'pantausiswa-db'` | Database belum dibuat → ulangi langkah 3. |
| Tabel kosong / `table doesn't exist` | Lupa langkah 6 → jalankan `npx prisma db push`. |
| Login: "Username tidak terdaftar" | Belum seeding → ulangi langkah 7 (pastikan `npm run dev` jalan dan `SETUP_KEY` sama). |
| Login: disuruh pilih peran / peran salah | Pilih tombol peran sesuai akun (Admin/Guru/Siswa/Sekretaris) sebelum tekan Masuk. |
| Seed: `Kunci salah` (403) | Isi `key` tidak sama dengan `SETUP_KEY` di `.env`. Setelah ubah `.env`, **restart `npm run dev`**. |
| `EPERM ... query_engine` saat generate | Ada proses `node` ganda mengunci file. Matikan semua (`taskkill /F /IM node.exe`), ulangi perintah. |
| Port 3000 dipakai | Matikan proses node lain, atau jalankan `npx next dev -p 3001` (URL jadi http://localhost:3001). |
| `.env` diubah tapi tidak berpengaruh | Restart `npm run dev` setiap kali mengubah `.env`. |
