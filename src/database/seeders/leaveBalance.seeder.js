import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../models/basic/User.model.js";
import LeaveBalance from "../../models/leave/LeaveBalance.model.js";

dotenv.config();

export const seedLeaveBalance = async () => {
  try {
    console.log("=== START SEEDING LEAVE BALANCE ===");

    // 1. Ambil semua user yang terdaftar di database
    const users = await User.find({});

    if (!users.length) {
      console.log("❌ Gagal: Tidak ada user di database. Jalankan seeder User terlebih dahulu.");
      return;
    }

    const currentYear = 2026;
    const defaultQuota = 12;
    const operations = [];

    // 2. Siapkan bulk operasi update/insert (upsert) untuk setiap user
    for (const user of users) {
      operations.push({
        updateOne: {
          filter: { userId: user._id, year: currentYear },
          update: {
            $setOnInsert: {
              totalQuota: defaultQuota,
              used: 0,
              remaining: defaultQuota,
            },
          },
          upsert: true, // Jika data balance belum ada, buat baru. Jika sudah ada, jangan timpa datanya.
        },
      });
    }

    // 3. Eksekusi menggunakan bulkWrite agar performanya cepat dan efisien
    const result = await LeaveBalance.bulkWrite(operations);

    console.log(` Matched: ${result.matchedCount}`);
    console.log(` Upserted: ${result.upsertedCount}`);
    console.log("=== LEAVE BALANCE SEEDING SUCCESSFUL ===");
  } catch (error) {
    console.error("❌ Proses seeding leave balance gagal total:", error);
  }
};

export default seedLeaveBalance;
