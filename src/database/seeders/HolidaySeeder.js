import mongoose from "mongoose";
import dotenv from "dotenv";
import Holiday from "../../models/calender/Holiday.model.js"; // Sesuaikan dengan path model lu

dotenv.config();

const holidays = [
  {
    name: "Tahun Baru 2026 Masehi",
    date: new Date("2026-01-01"),
    type: "NATIONAL",
    isDeductLeave: false,
    description: "Libur nasional memperingati Tahun Baru Masehi.",
    isRecurring: true,
    year: 2026,
  },
  {
    name: "Tahun Baru Imlek 2577 Kongzili",
    date: new Date("2026-02-17"),
    type: "RELIGIOUS",
    isDeductLeave: false,
    description: "Libur keagamaan Tahun Baru Imlek.",
    isRecurring: false,
    year: 2026,
  },
  {
    name: "Hari Suci Nyepi (Tahun Baru Saka 1948)",
    date: new Date("2026-03-19"),
    type: "RELIGIOUS",
    isDeductLeave: false,
    description: "Libur keagamaan Hari Raya Nyepi umat Hindu.",
    isRecurring: false,
    year: 2026,
  },
  {
    name: "Hari Raya Idul Fitri 1447 Hijriah (Hari ke-1)",
    date: new Date("2026-03-20"),
    type: "RELIGIOUS",
    isDeductLeave: false,
    description: "Libur keagamaan Hari Raya Idul Fitri.",
    isRecurring: false,
    year: 2026,
  },
  {
    name: "Hari Raya Idul Fitri 1447 Hijriah (Hari ke-2)",
    date: new Date("2026-03-21"),
    type: "RELIGIOUS",
    isDeductLeave: false,
    description: "Libur keagamaan Hari Raya Idul Fitri hari kedua.",
    isRecurring: false,
    year: 2026,
  },
  {
    name: "Cuti Bersama Perusahaan (Lebaran)",
    date: new Date("2026-03-23"),
    endDate: new Date("2026-03-25"), // Contoh libur rentang tanggal (3 hari)
    type: "COMPANY",
    isDeductLeave: true, // Mengurangi kuota cuti tahunan karyawan
    description: "Cuti bersama instansi/perusahaan, memotong jatah cuti tahunan.",
    isRecurring: false,
    year: 2026,
  },
  {
    name: "Wafat Yesus Kristus",
    date: new Date("2026-04-03"),
    type: "RELIGIOUS",
    isDeductLeave: false,
    description: "Libur keagamaan memperingati Wafat Yesus Kristus.",
    isRecurring: false,
    year: 2026,
  },
  {
    name: "Hari Buruh Internasional",
    date: new Date("2026-05-01"),
    type: "NATIONAL",
    isDeductLeave: false,
    description: "Peringatan Hari Buruh Internasional May Day.",
    isRecurring: true,
    year: 2026,
  },
  {
    name: "Hari Lahir Pancasila",
    date: new Date("2026-06-01"),
    type: "NATIONAL",
    isDeductLeave: false,
    description: "Peringatan Hari Lahir Pancasila.",
    isRecurring: true,
    year: 2026,
  },
  {
    name: "Hari Kemerdekaan Republik Indonesia",
    date: new Date("2026-08-17"),
    type: "NATIONAL",
    isDeductLeave: false,
    description: "Hari Ulang Tahun Kemerdekaan RI.",
    isRecurring: true,
    year: 2026,
  },
  {
    name: "Hari Raya Natal",
    date: new Date("2026-12-25"),
    type: "RELIGIOUS",
    isDeductLeave: false,
    description: "Libur keagamaan Hari Raya Natal.",
    isRecurring: true,
    year: 2026,
  },
];

const seedHolidays = async () => {
  try {
    // 1. Hubungkan ke database MongoDB
    // Pastikan MONGO_URI ada di file .env lu
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/hris_db");
    console.log("⚡ MongoDB Connected for Seeding...");

    console.log("⏳ Sedang menyuntikkan data hari libur...");

    // 2. Gunakan BulkWrite dengan operasi Upsert agar tidak duplikat saat dijalankan ulang
    const operations = holidays.map((holiday) => ({
      updateOne: {
        filter: { name: holiday.name, date: holiday.date }, // Kunci unik penentu data sudah ada/belum
        update: { $set: holiday },
        upsert: true,
      },
    }));

    const result = await Holiday.bulkWrite(operations);

    console.log("-----------------------------------------");
    console.log(`✅ Seeding Selesai!`);
    console.log(` Matched: ${result.matchedCount} data`);
    console.log(` Inserted (Baru): ${result.upsertedCount} data`);
    console.log(` Modified (Update): ${result.modifiedCount} data`);
    console.log("-----------------------------------------");

    // 3. Putuskan koneksi setelah selesai
    await mongoose.disconnect();
    console.log("🔌 MongoDB Connection Closed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Gagal:", error);
    process.exit(1);
  }
};

// Eksekusi fungsi seeder
seedHolidays();
