import mongoose from "mongoose";
import dotenv from "dotenv";
import Holiday from "../../models/calender/Holiday.model.js";

dotenv.config();

const holidays = [
  {
    name: "Tahun Baru 2026 Masehi",
    date: new Date("2026-01-01"),
    type: "NATIONAL",
    isDeductLeave: false,
    description: "Libur nasional memperingati Tahun Baru Masehi.",
    year: 2026,
  },
  {
    name: "Tahun Baru Imlek 2577 Kongzili",
    date: new Date("2026-02-17"),
    type: "RELIGIOUS",
    isDeductLeave: false,
    description: "Libur keagamaan Tahun Baru Imlek.",
    year: 2026,
  },
  {
    name: "Hari Suci Nyepi (Tahun Baru Saka 1948)",
    date: new Date("2026-03-19"),
    type: "RELIGIOUS",
    isDeductLeave: false,
    description: "Libur keagamaan Hari Raya Nyepi umat Hindu.",
    year: 2026,
  },
  {
    name: "Hari Raya Idul Fitri 1447 Hijriah (Hari ke-1)",
    date: new Date("2026-03-20"),
    type: "RELIGIOUS",
    isDeductLeave: false,
    description: "Libur keagamaan Hari Raya Idul Fitri.",
    year: 2026,
  },
  {
    name: "Hari Raya Idul Fitri 1447 Hijriah (Hari ke-2)",
    date: new Date("2026-03-21"),
    type: "RELIGIOUS",
    isDeductLeave: false,
    description: "Libur keagamaan Hari Raya Idul Fitri hari kedua.",
    year: 2026,
  },
  {
    name: "Wafat Yesus Kristus",
    date: new Date("2026-04-03"),
    type: "RELIGIOUS",
    isDeductLeave: false,
    description: "Libur keagamaan memperingati Wafat Yesus Kristus.",
    year: 2026,
  },
  {
    name: "Hari Buruh Internasional",
    date: new Date("2026-05-01"),
    type: "NATIONAL",
    isDeductLeave: false,
    description: "Peringatan Hari Buruh Internasional May Day.",
    year: 2026,
  },
  {
    name: "Hari Lahir Pancasila",
    date: new Date("2026-06-01"),
    type: "NATIONAL",
    isDeductLeave: false,
    description: "Peringatan Hari Lahir Pancasila.",
    year: 2026,
  },
  {
    name: "Hari Kemerdekaan Republik Indonesia",
    date: new Date("2026-08-17"),
    type: "NATIONAL",
    isDeductLeave: false,
    description: "Hari Ulang Tahun Kemerdekaan RI.",
    year: 2026,
  },
  {
    name: "Hari Raya Natal",
    date: new Date("2026-12-25"),
    type: "RELIGIOUS",
    isDeductLeave: false,
    description: "Libur keagamaan Hari Raya Natal.",
    year: 2026,
  },

  {
    name: "Cuti Bersama Tahun Baru Imlek 2577 Kongzili",
    date: new Date("2026-02-16"),
    type: "COMPANY",
    isDeductLeave: true,
    description: "Cuti bersama Imlek, memotong jatah cuti tahunan Pegawai.",
    year: 2026,
  },
  {
    name: "Cuti Bersama Hari Suci Nyepi",
    date: new Date("2026-03-18"),
    type: "COMPANY",
    isDeductLeave: true,
    description: "Cuti bersama Hari Raya Nyepi, memotong jatah cuti tahunan.",
    year: 2026,
  },
  {
    name: "Cuti Bersama Hari Raya Idul Fitri 1447 H (Pascalebaran 1)",
    date: new Date("2026-03-20"),
    type: "COMPANY",
    isDeductLeave: true,
    description: "Cuti bersama Idul Fitri, memotong jatah cuti tahunan.",
    year: 2026,
  },
  {
    name: "Cuti Bersama Hari Raya Idul Fitri 1447 H (Pascalebaran 2)",
    date: new Date("2026-03-23"),
    type: "COMPANY",
    isDeductLeave: true,
    description: "Cuti bersama Idul Fitri, memotong jatah cuti tahunan.",
    year: 2026,
  },
  {
    name: "Cuti Bersama Hari Raya Idul Fitri 1447 H (Pascalebaran 3)",
    date: new Date("2026-03-24"),
    type: "COMPANY",
    isDeductLeave: true,
    description: "Cuti bersama Idul Fitri, memotong jatah cuti tahunan.",
    year: 2026,
  },
  {
    name: "Cuti Bersama Kenaikan Yesus Kristus",
    date: new Date("2026-05-15"),
    type: "COMPANY",
    isDeductLeave: true,
    description: "Cuti bersama Kenaikan Yesus Kristus, memotong jatah cuti tahunan.",
    year: 2026,
  },
  {
    name: "Cuti Bersama Hari Raya Idul Adha 1447 H",
    date: new Date("2026-05-28"),
    type: "COMPANY",
    isDeductLeave: true,
    description: "Cuti bersama Idul Adha, memotong jatah cuti tahunan.",
    year: 2026,
  },
  {
    name: "Cuti Bersama Hari Raya Natal",
    date: new Date("2026-12-24"),
    type: "COMPANY",
    isDeductLeave: true,
    description: "Cuti bersama Natal, memotong jatah cuti tahunan.",
    year: 2026,
  },
];

const holidaysSeeder = async () => {
  try {
    console.log("⏳ Sedang memproses data hari libur dan cuti bersama 2026...");

    const operations = holidays.map((holiday) => ({
      updateOne: {
        filter: { name: holiday.name, date: holiday.date },
        update: { $set: holiday },
        upsert: true,
      },
    }));

    const result = await Holiday.bulkWrite(operations);

    console.log("-----------------------------------------");
    console.log(`Seeding Kalender SKB 2026 Selesai!`);
    console.log(`   - Total Terbaca  : ${holidays.length} Hari`);
    console.log(`   - Match Berhasil : ${result.matchedCount} data`);
    console.log(`   - Baru Disuntik  : ${result.upsertedCount} data`);
    console.log(`   - Data Terupdate : ${result.modifiedCount} data`);
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("Proses seeding kalender gagal total:", error);
  }
};

export default holidaysSeeder;
