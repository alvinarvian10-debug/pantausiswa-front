# Design System & UI Guidelines: Sistem Pantauan Siswa

## 1. Tema Utama (Art Direction)
*   **Gaya Desain:** Minimalist B2B SaaS dengan sentuhan Modern Glassmorphism.
*   **Kesan:** Bersih, premium, ringan, dan sangat fokus pada konten (tidak berisik).
*   **Whitespace:** Ekstra lega. Gunakan jarak antar elemen yang luas (`gap-6`, `p-8`, `py-16`) untuk menciptakan ilusi ruang yang menenangkan ala minimalisme.

## 2. Palet Warna (Color Palette)
Warna dibuat seminimal mungkin agar tidak mengganggu mata, dengan Hijau sebagai satu-satunya *focal point*:
*   **Primary Accent:** Hijau Segar (`emerald-500` atau `green-500`) untuk tombol utama, ikon, dan indikator status aktif.
*   **Background Latar (Base):** Abu-abu sangat terang atau *off-white* (`bg-slate-50` / `bg-gray-50`) dengan sedikit aksen gradasi pudar di sudut halaman agar efek *glassmorphism*-nya terlihat.
*   **Teks:** Abu-abu pekat (`text-gray-900`) untuk judul, dan abu-abu lembut (`text-gray-500`) untuk teks pendukung.

## 3. Efek Glassmorphism (Kaca Tembus Pandang)
Untuk *Sidebar*, *Top Bar*, *Card*, dan *Modal/Pop-up*, gunakan kombinasi kelas Tailwind berikut alih-alih warna solid biasa:
*   **Base Glass Class:** `bg-white/70 backdrop-blur-md border border-white/40 shadow-sm`
*   *Penjelasan:* Ini akan membuat kartu/komponen berwarna putih tapi sedikit transparan (`/70`), memburamkan latar belakang di baliknya (`backdrop-blur-md`), dan memberikan garis tepi tipis yang bersinar (`border-white/40`) agar terlihat seperti lembaran kaca estetik.

## 4. Tipografi Minimalis
*   **Font Family:** Inter atau Roboto (Sangat bersih dan mudah dibaca).
*   **Aturan Minimalisme:** Kurangi penggunaan teks tebal (*bold*) di sembarang tempat. Gunakan perbedaan **ukuran** (misal: `text-2xl` vs `text-sm`) dan **warna** (`text-gray-900` vs `text-gray-400`) untuk membedakan hierarki informasi, bukan garis bawah atau kotak tebal.

## 5. Komponen & Interaksi Lembut
*   **Bentuk Elemen:** Sudut membulat yang konsisten (`rounded-xl` atau `rounded-2xl`) untuk menyempurnakan efek kaca.
*   **Tombol Utama:** Solid hijau (`bg-emerald-500 text-white rounded-lg transition-all duration-300 hover:bg-emerald-600 hover:shadow-lg hover:-translate-y-1 active:scale-95`).
*   **Tabel & Daftar Minimalis:** Hilangkan garis pembatas ( *border* ) yang tebal pada tabel. Gunakan jarak yang renggang dan garis bawah yang sangat tipis (`border-b border-gray-100`) agar data "bernapas".