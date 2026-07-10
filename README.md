# Sistem Informasi Kepegawaian

Sistem Informasi Kepegawaian merupakan aplikasi berbasis web yang dirancang untuk membantu digitalisasi proses administrasi kepegawaian di perusahaan. Sistem ini mengelola berbagai proses operasional seperti manajemen data pegawai, kehadiran, cuti, lembur, hingga dinas luar melalui mekanisme persetujuan bertingkat (multi-level approval).

Proyek ini dikembangkan sebagai bagian dari tugas akhir dan berfokus pada penerapan arsitektur backend yang modular, workflow approval, serta manajemen data menggunakan MongoDB.

---

## 🚀 Fitur Utama

### 👤 Manajemen Kepegawaian

- Manajemen data pegawai
- Role-Based Access Control (RBAC)
- Session-based Authentication
- Manajemen jabatan dan divisi
- Profil pegawai

### 🕒 Manajemen Kehadiran

- Check In / Check Out
- Riwayat kehadiran
- Koreksi absensi
- Monitoring kehadiran pegawai

### 🌴 Manajemen Cuti

- Pengajuan cuti
- Persetujuan bertingkat
- Perhitungan sisa kuota cuti
- Riwayat pengajuan cuti

### ⏱️ Manajemen Lembur

- Pengajuan lembur
- Approval oleh manajer
- Dokumentasi hasil pekerjaan
- Riwayat lembur

### ✈️ Manajemen Dinas Luar

- Pengajuan dinas luar
- Workflow persetujuan multi-level
- Timeline perjalanan dinas
- Monitoring anggaran
- Proses pencairan dana oleh bagian keuangan

---

## 🛠️ Tech Stack

| Layer           | Technology                       |
| --------------- | -------------------------------- |
| Backend         | Node.js, Express.js              |
| Database        | MongoDB                          |
| ODM             | Mongoose                         |
| Template Engine | EJS                              |
| CSS Framework   | Tailwind CSS                     |
| Authentication  | Session Authentication           |
| Authorization   | Role-Based Access Control (RBAC) |

---

## 📁 Struktur Proyek

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

## 👥 Role Pengguna

| Role     | Deskripsi                                                                        |
| -------- | -------------------------------------------------------------------------------- |
| Pegawai  | Mengajukan cuti, lembur, dinas luar, koreksi absensi, serta melihat data pribadi |
| Manajer  | Melakukan review dan approval pengajuan bawahan                                  |
| HR       | Mengelola data kepegawaian dan approval sesuai alur bisnis                       |
| Direktur | Approval tingkat akhir pada workflow tertentu                                    |
| Keuangan | Mengelola pembayaran dan monitoring anggaran dinas luar                          |

---

## 🔄 Workflow Approval

### Cuti

```text
Pegawai
    │
    ▼
Manajer
    │
    ▼
HR
```

---

### Lembur

```text
Pegawai
    │
    ▼
Manajer
```

---

### Dinas Luar

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

## ⚙️ Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/mseptiawan/hris-zafa.git

cd hris-zafa
```

---

### 2. Install Dependency

```bash
npm install
```

---

### 3. Konfigurasi Environment

Buat file `.env`

```env
PORT=3000

MONGODB_URI=mongodb://localhost:27017/hris_zafa_tour

SESSION_SECRET=your_session_secret

NODE_ENV=development
```

---

### 4. Jalankan Aplikasi

Mode Development

```bash
npm run dev
```

Mode Production

```bash
npm start
```

Aplikasi akan berjalan pada:

```
http://localhost:3000
```

---

## 📂 Arsitektur

Aplikasi menggunakan pendekatan modular sehingga setiap fitur dipisahkan ke dalam beberapa layer.

```text
Routes
   │
   ▼
Controllers
   │
   ▼
Services
   │
   ▼
Models (MongoDB)
```

---

## 🔒 Authentication & Authorization

Sistem menggunakan:

- Session-based Authentication
- Role-Based Access Control (RBAC)
- Middleware Authorization
- Middleware Validation

---

## 📌 Modul yang Tersedia

- Authentication
- Employee Management
- Attendance
- Leave Management
- Overtime Management
- Business Trip Management
- Approval Workflow
- Notification
- Dashboard
- Reporting

---

## 📈 Status Proyek

Status saat ini:

- ✅ Employee Management
- ✅ Authentication
- ✅ Attendance
- ✅ Leave Management
- ✅ Overtime Management
- ✅ Business Trip Management
- ✅ Multi-Level Approval
- 🚧 Payroll (Development)
- 🚧 Reward & Punishment (Development)

---

## 📝 Lisensi

Proyek ini dikembangkan sebagai bagian dari penelitian akademik (Tugas Akhir) dan digunakan untuk tujuan edukasi.

---

## 👨‍💻 Author

**M. Septiawan**

- GitHub: https://github.com/mseptiawan
- LinkedIn: https://www.linkedin.com/in/mseptiawan/
- Email: mseptiawan017@gmail.com
