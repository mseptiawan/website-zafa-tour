import mongoose from "mongoose";
import dotenv from "dotenv";

import Announcement from "../../models/Announcement.model.js";
import User from "../../models/basic/User.model.js";

dotenv.config();

const usernames = ["ongkidwi", "duwihartati"];

const announcements = [
  {
    title: "Perubahan Jam Operasional Kantor Pusat",
    content: `
Mulai tanggal 1 Juni 2026, jam operasional kantor pusat mengalami perubahan menjadi pukul 08.00 WIB sampai dengan 17.00 WIB.

Perubahan ini dilakukan untuk menyesuaikan kebutuhan operasional perusahaan dan meningkatkan efektivitas koordinasi antar divisi.

Seluruh Pegawai diwajibkan hadir tepat waktu dan melakukan absensi sesuai prosedur yang berlaku. Keterlambatan tanpa alasan yang jelas akan dicatat dalam evaluasi kedisiplinan bulanan.

Untuk divisi tertentu yang memiliki kebutuhan operasional khusus, jadwal kerja akan diinformasikan langsung oleh masing-masing pimpinan divisi.
    `,
    category: "OFFICIAL",
  },

  {
    title: "Maintenance Sistem HRIS dan Payroll",
    content: `
Divisi IT akan melakukan maintenance terhadap sistem HRIS dan payroll perusahaan pada hari Sabtu pukul 21.00 WIB hingga Minggu pukul 06.00 WIB.

Selama proses maintenance berlangsung, beberapa fitur seperti pengajuan cuti, absensi online, reimbursement, dan slip gaji tidak dapat diakses sementara waktu.

Kami menghimbau seluruh Pegawai untuk menyelesaikan kebutuhan administrasi sebelum jadwal maintenance dimulai guna menghindari kendala operasional.

Apabila ditemukan kendala setelah maintenance selesai, segera hubungi tim IT support internal.
    `,
    category: "OFFICIAL",
  },

  {
    title: "Pelaksanaan Training Internal Cyber Security",
    content: `
Dalam rangka meningkatkan kesadaran keamanan digital perusahaan, akan dilaksanakan training internal mengenai cyber security dan perlindungan data perusahaan.

Materi training meliputi:
- Pencegahan phishing
- Pengamanan password
- Penggunaan VPN perusahaan
- Identifikasi malware
- Kebijakan keamanan perangkat kerja

Seluruh Pegawai wajib mengikuti kegiatan ini karena akan menjadi bagian dari penilaian kepatuhan keamanan informasi perusahaan.
    `,
    category: "OFFICIAL",
  },

  {
    title: "Kegiatan Family Gathering Tahunan",
    content: `
Perusahaan akan mengadakan kegiatan family gathering tahunan pada akhir bulan ini sebagai bentuk apresiasi terhadap seluruh Pegawai dan keluarga.

Acara akan dilaksanakan selama dua hari satu malam dengan berbagai agenda seperti outbound, team building, hiburan, dan pembagian penghargaan Pegawai terbaik.

Diharapkan seluruh Pegawai dapat berpartisipasi untuk mempererat hubungan antar tim dan meningkatkan semangat kerja bersama.
    `,
    category: "LIGHT",
  },

  {
    title: "Evaluasi Kinerja Semester Pertama 2026",
    content: `
Manajemen perusahaan akan melaksanakan evaluasi kinerja semester pertama pada minggu kedua bulan Juni 2026.

Setiap divisi diwajibkan menyiapkan:
- Laporan capaian target
- Kendala operasional
- Rencana pengembangan
- Strategi peningkatan performa

Hasil evaluasi akan digunakan sebagai dasar pengambilan keputusan terkait promosi, bonus kinerja, dan pengembangan organisasi.
    `,
    category: "OFFICIAL",
  },

  {
    title: "Penerapan Sistem Absensi Digital Baru",
    content: `
Mulai bulan depan, perusahaan akan menggunakan sistem absensi digital berbasis mobile untuk meningkatkan akurasi pencatatan kehadiran.

Pegawai diwajibkan melakukan:
- Check in saat masuk kerja
- Check out saat selesai bekerja
- Validasi lokasi kerja

Penggunaan titip absensi atau manipulasi data kehadiran akan dikenakan sanksi sesuai peraturan perusahaan.
    `,
    category: "OFFICIAL",
  },

  {
    title: "Kebijakan Work From Office",
    content: `
Berdasarkan hasil evaluasi manajemen, perusahaan menetapkan kebijakan Work From Office penuh untuk seluruh divisi operasional mulai bulan depan.

Kebijakan ini diterapkan guna meningkatkan koordinasi kerja, percepatan pengambilan keputusan, dan efektivitas komunikasi antar tim.

Pengecualian hanya berlaku untuk kondisi tertentu yang telah mendapatkan persetujuan langsung dari HR dan pimpinan divisi terkait.
    `,
    category: "OFFICIAL",
  },

  {
    title: "Pemberitahuan Cuti Bersama Nasional",
    content: `
Sehubungan dengan penetapan cuti bersama nasional oleh pemerintah, perusahaan akan menyesuaikan jadwal operasional selama periode libur berlangsung.

Seluruh Pegawai diminta memastikan:
- Pekerjaan utama telah diselesaikan
- Dokumen penting telah diamankan
- Koordinasi antar tim tetap berjalan

Divisi tertentu yang memiliki operasional khusus tetap diwajibkan standby sesuai jadwal piket yang telah ditentukan.
    `,
    category: "OFFICIAL",
  },

  {
    title: "Rapat Koordinasi Seluruh Divisi",
    content: `
Akan dilaksanakan rapat koordinasi lintas divisi guna membahas progres operasional perusahaan dan target semester kedua tahun 2026.

Agenda utama meliputi:
- Evaluasi pencapaian target
- Kendala antar divisi
- Efisiensi operasional
- Strategi pertumbuhan perusahaan

Kehadiran seluruh kepala divisi dan supervisor bersifat wajib.
    `,
    category: "OFFICIAL",
  },

  {
    title: "Peluncuran Sistem HRIS Generasi Baru",
    content: `
Perusahaan resmi meluncurkan sistem HRIS terbaru yang memiliki berbagai fitur tambahan untuk meningkatkan efisiensi administrasi Pegawai.

Fitur baru meliputi:
- Pengajuan cuti online
- Reimbursement digital
- Tracking approval
- Dashboard performa
- Integrasi payroll

Panduan penggunaan akan dibagikan melalui email internal dan sesi pelatihan khusus akan dijadwalkan minggu depan.
    `,
    category: "OFFICIAL",
  },
];

const attachments = [
  null,
  null,
  "/uploads/announcement/company-policy.pdf",
  "/uploads/announcement/training-schedule.pdf",
  "/uploads/announcement/hris-guide.pdf",
  "/uploads/announcement/family-gathering.pdf",
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate() {
  const start = new Date(2026, 0, 1);
  const end = new Date();

  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export default async function announcementSeeder() {
  try {
    const users = await User.find({
      username: { $in: usernames },
    });

    if (!users.length) {
      return;
    }

    await Announcement.deleteMany({});

    const data = [];
    const now = new Date();

    for (const user of users) {
      for (let i = 0; i < 4; i++) {
        const item = randomItem(announcements);

        let createdAt = randomDate();

        if (new Date(createdAt) > now) {
          createdAt = now;
        }

        const signedByUser = Math.random() > 0.4 ? randomItem(users) : null;

        data.push({
          title: item.title,
          content: item.content.trim(),
          category: item.category,
          createdBy: user._id,
          attachment: randomItem(attachments),
          signedBy: signedByUser?._id || null,
          publishDate: createdAt,
          createdAt,
          updatedAt: now,
        });
      }
    }

    await Announcement.insertMany(data);

    console.log("Seeder Announcement berhasil dibuat");
  } catch (err) {
    console.error(err);
    throw err;
  }
}
