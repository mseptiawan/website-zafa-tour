# Sistem Informasi Kepegawaian (SIMPEG)

Sistem Informasi Kepegawaian (SIMPEG) merupakan aplikasi berbasis web yang dirancang untuk membantu digitalisasi proses administrasi kepegawaian di perusahaan. Sistem ini mengelola berbagai proses operasional seperti manajemen data pegawai, kehadiran, cuti, lembur, hingga dinas luar melalui mekanisme persetujuan bertingkat (_multi-level approval_).

Proyek ini dikembangkan sebagai bagian dari tugas akhir dan berfokus pada penerapan arsitektur backend yang modular, workflow approval, serta manajemen data menggunakan MongoDB dan Redis.

---

# 🚀 Fitur Utama

## 👤 Manajemen Kepegawaian

- Manajemen data pegawai
- Role-Based Access Control (RBAC)
- Session-based Authentication
- Manajemen jabatan dan divisi
- Profil pegawai

## 🕒 Manajemen Kehadiran

- Check In / Check Out
- Riwayat kehadiran
- Koreksi absensi 
- Monitoring kehadiran pegawai

## 🌴 Manajemen Cuti

- Pengajuan cuti
- Persetujuan bertingkat
- Perhitungan sisa kuota cuti
- Riwayat pengajuan cuti

## ⏱️ Manajemen Lembur

- Pengajuan lembur
- Approval oleh manajer
- Dokumentasi hasil pekerjaan
- Riwayat lembur

## ✈️ Manajemen Dinas Luar

- Pengajuan dinas luar
- Workflow persetujuan multi-level
- Timeline perjalanan dinas
- Monitoring anggaran
- Proses pencairan dana oleh bagian keuangan

---

# 🛠️ Tech Stack

| Layer                 | Technology                       |
| --------------------- | -------------------------------- |
| Backend               | Node.js, Express.js              |
| Database              | MongoDB                          |
| Cache & Session Store | Redis                            |
| ODM                   | Mongoose                         |
| Template Engine       | EJS                              |
| CSS Framework         | Tailwind CSS                     |
| Authentication        | Session-based Authentication     |
| Authorization         | Role-Based Access Control (RBAC) |

---

# ⚡ Infrastruktur

Sistem menggunakan beberapa komponen utama berikut:

- **Node.js** sebagai runtime aplikasi.
- **Express.js** sebagai framework backend.
- **MongoDB** sebagai database utama.
- **Redis** sebagai session store dan cache untuk meningkatkan performa aplikasi.
- **Mongoose** sebagai Object Data Modeling (ODM).
- **EJS** sebagai template engine berbasis Server-Side Rendering (SSR).
- **Tailwind CSS** sebagai framework CSS.

---

# 📁 Struktur Proyek

```text
src/
├── config/          # Konfigurasi aplikasi
├── controllers/     # Request handler
├── middleware/      # Authentication, Authorization, Validation
├── models/          # Mongoose Models
├── routes/          # Express Routes
├── services/        # Business Logic
├── utils/           # Helper Functions
├── views/           # EJS Templates
├── app.js
└── server.js
```

---

# 👥 Role Pengguna

| Role     | Deskripsi                                                                        |
| -------- | -------------------------------------------------------------------------------- |
| Pegawai  | Mengajukan cuti, lembur, dinas luar, koreksi absensi, serta melihat data pribadi |
| Manajer  | Melakukan review dan approval pengajuan bawahan                                  |
| HR       | Mengelola data kepegawaian dan approval sesuai alur bisnis                       |
| Direktur | Approval tingkat akhir pada workflow tertentu                                    |
| Keuangan | Mengelola pembayaran dan monitoring anggaran dinas luar                          |

---

# 🔄 Workflow Approval

## Cuti

```text
Pegawai
    │
    ▼
Manajer
    │
    ▼
HR
```

## Lembur

```text
Pegawai
    │
    ▼
Manajer
```

## Dinas Luar

```text
Pegawai
    │
    ▼
Manajer
    │
    ▼
HR / Direktur
    │
    ▼
Keuangan
```

---

# ⚙️ Instalasi

## 1. Clone Repository

```bash
git clone https://github.com/mseptiawan/hris-zafa.git

cd hris-zafa
```

---

## 2. Install Dependency

```bash
npm install
```

---

## 📌 Catatan

Sebelum menjalankan aplikasi untuk pertama kali, lakukan proses seeding database agar data awal seperti akun, role, jabatan, divisi, dan data pendukung lainnya tersedia.

Jalankan perintah berikut:

```bash
npm run seed
```

> **Catatan:** Jalankan seeder hanya saat pertama kali menginisialisasi database atau ketika ingin mengisi ulang data awal. Jika database sudah berisi data, Anda tidak perlu menjalankan seeder kembali.

---

## 3. Konfigurasi Environment

Buat file `.env` pada root project.

```env
PORT=3000

MONGODB_URI=mongodb://localhost:27017/hris_zafa_tour

REDIS_URL=redis://localhost:6379

SESSION_SECRET=your_session_secret

NODE_ENV=development
```

---

## 4. Jalankan Redis

Pastikan Redis sudah berjalan sebelum menjalankan aplikasi.

### Linux / macOS

```bash
redis-server
```

### Docker

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7
```

---

## 5. Jalankan Aplikasi

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

Aplikasi akan berjalan di:

```text
http://localhost:3000
```

---

# 📂 Arsitektur

Aplikasi menggunakan arsitektur modular agar setiap layer memiliki tanggung jawab yang jelas.

```text
Client
   │
   ▼
Express Routes
   │
   ▼
Controllers
   │
   ▼
Services
   │
   ▼
Models (Mongoose)
   │
   ▼
MongoDB
```

Redis digunakan sebagai **Session Store** dan **Cache Layer** untuk meningkatkan performa aplikasi.

---

# 🔒 Authentication & Authorization

Sistem menggunakan:

- Session-based Authentication
- Redis Session Store
- Role-Based Access Control (RBAC)
- Middleware Authorization
- Middleware Validation

---

# 📌 Modul yang Tersedia

- Authentication
- Employee Management
- Attendance Management
- Leave Management
- Overtime Management
- Business Trip Management
- Multi-Level Approval Workflow
- Notification
- Dashboard
- Reporting

---

# 📈 Status Proyek

| Modul                    | Status         |
| ------------------------ | -------------- |
| Authentication           | ✅             |
| Employee Management      | ✅             |
| Attendance               | ✅             |
| Leave Management         | ✅             |
| Overtime Management      | ✅             |
| Business Trip Management | ✅             |
| Multi-Level Approval     | ✅             |
| Payroll                  | 🚧 Development |
| Reward & Punishment      | 🚧 Development |

---

# 📝 Lisensi

Proyek ini dikembangkan sebagai bagian dari penelitian akademik (Tugas Akhir) dan digunakan untuk tujuan edukasi.

---

# 👨‍💻 Author

**M. Septiawan**

- GitHub: https://github.com/mseptiawan
- LinkedIn: https://www.linkedin.com/in/mseptiawan/
- Email: mseptiawan017@gmail.com
