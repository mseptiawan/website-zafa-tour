import mongoose from "mongoose";
import dotenv from "dotenv";

import Announcement from "../../models/Announcement.js";
import User from "../../models/User.js";

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

// =========================
// TARGET USERS
// =========================
const usernames = ["basoherman", "ongkidwi", "sarwanto", "duwihartati", "ronaldrizky", "fadhilah"];

// =========================
// SAMPLE DATA
// =========================
const titles = [
  "Perubahan Jam Operasional Kantor",
  "Pemberitahuan Maintenance Sistem",
  "Pelaksanaan Training Internal",
  "Kegiatan Family Gathering",
  "Evaluasi Kinerja Semester 1",
  "Penggunaan Absensi Digital",
  "Kebijakan Work From Office",
  "Pemberitahuan Cuti Bersama",
  "Rapat Koordinasi Divisi",
  "Peluncuran Sistem HRIS Baru",
];

const contents = [
  "Seluruh karyawan diharapkan memperhatikan perubahan kebijakan terbaru yang berlaku mulai minggu depan.",

  "Akan dilakukan maintenance sistem sehingga beberapa layanan internal tidak dapat digunakan sementara waktu.",

  "Karyawan diwajibkan mengikuti kegiatan internal perusahaan sesuai jadwal yang telah ditentukan.",

  "Mohon seluruh divisi melakukan koordinasi dan memastikan seluruh data telah diperbarui.",

  "Pengumuman ini dibuat untuk meningkatkan efisiensi operasional perusahaan.",

  "Harap seluruh pegawai membaca informasi ini dengan seksama dan mengikuti ketentuan yang berlaku.",
];

const attachments = [
  null,
  null,
  "/uploads/announcement/sample1.pdf",
  "/uploads/announcement/sample2.pdf",
  "/uploads/announcement/sample3.pdf",
];

const categories = ["LIGHT", "OFFICIAL"];

// =========================
// HELPERS
// =========================
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate() {
  const start = new Date(2026, 0, 1);
  const end = new Date(2026, 4, 30);

  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// =========================
// MAIN SEED
// =========================
async function seed() {
  try {
    const users = await User.find({
      username: { $in: usernames },
    });

    if (!users.length) {
      console.log("User tidak ditemukan");
      process.exit();
    }

    // hapus data lama
    await Announcement.deleteMany({});

    const data = [];

    for (const user of users) {
      for (let i = 0; i < 15; i++) {
        const createdAt = randomDate();

        data.push({
          title: randomItem(titles),

          content: randomItem(contents),

          category: randomItem(categories),

          createdBy: user._id,

          attachment: randomItem(attachments),

          signedBy: Math.random() > 0.5 ? randomItem(users)._id : null,

          publishDate: createdAt,

          createdAt,

          updatedAt: new Date(),
        });
      }
    }

    await Announcement.insertMany(data);

    console.log("Seeder Announcement COMPLETE");

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
    mongoose.disconnect();
  }
}

seed();
