import dotenv from "dotenv";

import SalesVisit from "../../models/SalesVisit.model.js";
import User from "../../models/basic/User.js";

dotenv.config();

// =========================
// TARGET USERS
// =========================
const usernames = ["basoherman", "ongkidwi", "sarwanto", "duwihartati", "ronaldrizky", "fadhilah"];

// =========================
// SAMPLE DATA
// =========================
const titles = [
  "Visit Toko Sinar Jaya",
  "Meeting Supplier PT Maju",
  "Kunjungan Outlet Palembang",
  "Follow Up Customer Baru",
  "Negosiasi Harga Produk",
  "Visit Retail Partner",
  "Maintenance Hubungan Client",
  "Survey Lokasi Distribusi",
  "Kunjungan Sales Harian",
  "Meeting Project Partnership",
];

const addresses = [
  "Jl. Sudirman No. 12, Palembang",
  "Jl. Angkatan 45 No. 88",
  "Jl. Demang Lebar Daun",
  "Jl. Basuki Rahmat",
  "Jl. Veteran",
  "Jl. R. Sukamto",
];

const meetWithList = [
  "Owner",
  "Manager Operasional",
  "Staff Marketing",
  "Supervisor Toko",
  "Direktur",
  "Admin Store",
];

const results = [
  "Prospek sangat potensial, akan follow up minggu depan.",
  "Sudah terjadi kesepakatan awal untuk kerja sama.",
  "Customer masih mempertimbangkan penawaran harga.",
  "Permintaan masih dalam tahap diskusi internal.",
  "Transaksi berhasil dan sudah masuk pipeline.",
  "Perlu revisi penawaran sebelum deal.",
  "Tidak ada keputusan final, masih waiting approval.",
];

const attachmentsSample = [
  [],
  [],
  [
    {
      filename: "sample1.jpg",
      originalName: "foto1.jpg",
      mimetype: "image/jpeg",
      size: 120000,
      path: "/uploads/files/sample1.jpg",
    },
  ],
  [
    {
      filename: "sample2.pdf",
      originalName: "dokumen.pdf",
      mimetype: "application/pdf",
      size: 300000,
      path: "/uploads/files/sample2.pdf",
    },
  ],
];

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
export default async function salesVisitSeeder() {
  try {
    const users = await User.find({
      username: { $in: usernames },
    });

    if (!users.length) {
      console.log("User tidak ditemukan");
      return;
    }

    await SalesVisit.deleteMany({});

    const data = [];

    for (const user of users) {
      for (let i = 0; i < 20; i++) {
        const createdAt = randomDate();

        data.push({
          userId: user._id,

          title: randomItem(titles),

          address: randomItem(addresses),

          meetWith: randomItem(meetWithList),

          result: randomItem(results),

          attachments: randomItem(attachmentsSample),

          visitTime: createdAt,

          createdAt,
          updatedAt: new Date(),
        });
      }
    }

    await SalesVisit.insertMany(data);

    console.log("Seeder SalesVisit COMPLETE");
  } catch (err) {
    console.error(err);
  }
}
