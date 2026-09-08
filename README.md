# Calora — Move. Track. Eat Better. 🏃🥗

Calora adalah platform pelacak kebugaran, nutrisi cerdas, dan aktivitas fisik berbasis web modern yang dirancang khusus dengan dukungan database makanan Indonesia (TKPI Kemenkes RI) serta sistem pelacakan GPS live langsung dari web browser.

---

## 🌟 Fitur Utama

### 1. 📷 AI Food Scanner (Zero-Cost Free Tier)
- **Visual Food Recognition**: Mengidentifikasi komponen makanan secara visual menggunakan model **Google Gemini Free Tier** (`gemini-3.5-flash-lite`).
- **Strict Matching Contract**: Mengembalikan status deterministik (`detected`, `not_detected`, `not_in_database`) tanpa halusinasi atau fallback acak.
- **Server-Side Nutrition Recalculation**: AI hanya mengestimasi porsi visual dalam gram; perhitungan kalori dan makronutrisi (protein, karbohidrat, lemak) dihitung 100% di sisi server berdasarkan database pangan lokal.
- **Rate-Limited**: Dilengkapi pengamanan rate limiter (`10 req/menit`) untuk melindungi kuota API.

### 2. 📦 Barcode Product Scanner
- Integrasi dengan **Open Food Facts API** untuk memindai barcode produk makanan/minuman kemasan komersial dan menyimpannya langsung ke log harian.

### 3. ⏱️ Live Web GPS Tracker & Rute Peta
- **Native Browser GPS**: Menggunakan `navigator.geolocation.watchPosition` dengan akurasi tinggi tanpa memerlukan aplikasi pihak ketiga atau dependensi eksternal berbayar.
- **Filter Koordinat Server**: Server menyaring jitter sinyal, membatasi akurasi maksimal (100m), menolak loncatan jarak tidak wajar, dan menghitung ulang jarak sebenarnya dengan formula Haversine.
- **Visualisasi Peta Interaktif**: Rute disimpan dalam format Google Encoded Polyline dan dirender menggunakan **Leaflet & OpenStreetMap**.
- **Fitur Sesi Tangguh**:
  - Dukungan **Screen Wake Lock API** agar layar smartphone tetap menyala saat olahraga berlangsung.
  - Penyimpanan checkpoint sesi otomatis di `localStorage` untuk pemulihan aktivitas jika halaman browser tertutup/ter-refresh tanpa sengaja.
  - Penghitungan durasi aktif yang otomatis memotong jeda waktu (*pause*).

### 4. 🍽️ Smart Nutrition & Energy Balance
- **Dynamic Calorie Balance**: Target defisit/surplus kalori harian otomatis disesuaikan dengan kalori yang terbakar dari sesi latihan hari ini.
- **Database Pangan Indonesia**: Memuat puluhan menu lokal (Nasi Padang, Rendang, Soto, Gado-Gado, Ayam Goreng, dll.) lengkap dengan tabel alias nama daerah.

### 5. 💬 Calora AI Assistant
- Asisten nutrisi dan kebugaran cerdas yang memahami konteks profil biometrik (BMR, TDEE, sisa kalori, target protein, dan riwayat aktivitas latihan hari ini).
- Fallback cerdas berbasis heuristik lokal jika kuota AI eksternal sedang tidak tersedia.

### 6. 🏆 Tantangan & Gamifikasi
- Tantangan bulanan (*Challenges*) berbasis target jarak (KM), kalori (KCAL), dan konsistensi sesi aktif mingguan.
- Sistem perolehan poin dan lencana (*achievement badges*).

### 7. 👥 Komunitas & Social Feed
- Berbagi catatan aktivitas ke linimasa komunitas sesama pengguna Calora.
- Fitur like, komentar interaktif, dan papan peringkat (*leaderboard*) mingguan.

---

## 🛠️ Tech Stack

- **Backend**: [Laravel 11](https://laravel.com/) (PHP 8.5)
- **Frontend SPA**: [Inertia.js v2](https://inertiajs.com/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Peta & Geolocation**: [Leaflet.js](https://leafletjs.com/) + OpenStreetMap Tiles
- **Database**: SQLite (Default) / MySQL / PostgreSQL
- **Vision AI**: Google Gemini API (`gemini-3.5-flash-lite`) via Google AI Studio

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat Sistem
- PHP 8.5+ dengan ekstensi cURL, OpenSSL, SQLite, MBString, PDO.
- Composer 2+
- Node.js 20+ & npm
- Git

### 2. Clone Repository
```bash
git clone https://github.com/Diabyy/Calora.git
cd Calora
```

### 3. Install Dependensi PHP & JavaScript
```bash
composer install
npm install
```

### 4. Konfigurasi Environment File
Salin template konfigurasi:
```bash
cp .env.example .env
php artisan key:generate
```

Buka file `.env` dan atur kunci API Gemini Free Tier Anda:
```env
DB_CONNECTION=sqlite

# Dapatkan API Key gratis di https://aistudio.google.com/
GEMINI_API_KEY="AIzaSy..."
VISION_MIN_CONFIDENCE=0.75
```

### 5. Migrasi & Seeding Database
Jalankan migrasi database dan pengisian dataset pangan lokal serta tantangan:
```bash
php artisan migrate --seed
```

### 6. Jalankan Server Pengembangan
Buka terminal dan jalankan server Laravel:
```bash
php artisan serve
```

Buka terminal terpisah untuk menjalankan Vite (Hot Module Replacement):
```bash
npm run dev
```
*Atau untuk kompilasi aset produksi:*
```bash
npm run build
```

Aplikasi siap diakses melalui browser di: `http://localhost:8000`

---

## 🧪 Pengujian & Kode Standar

Proyek ini dilengkapi pengujian otomatis menyeluruh (feature tests untuk otentikasi, alur nutrisi, AI vision contract, rate limiting, validasi GPS server, tantangan, dan komunitas):

```bash
# Menjalankan seluruh pengujian PHPUnit
php artisan test --compact

# Menjalankan format standar kode PHP (Laravel Pint)
vendor/bin/pint --format agent

# Type-check TypeScript & Build Frontend
npm run build
```

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).
