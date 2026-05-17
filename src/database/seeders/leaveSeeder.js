import mongoose from "mongoose";
import dotenv from "dotenv";

import Leave from "../../models/Leave.js";
import User from "../../models/User.js";
import LeaveType from "../../models/LeaveType.js";

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

// ======================================================
// TARGET USERS
// ======================================================

const usernames = ["basoherman", "ongkidwi", "sarwanto", "duwihartati", "ronaldrizky", "fadhilah"];

// ======================================================
// MASTER DATA
// ======================================================

const reasons = [
  "Sakit dan perlu istirahat",
  "Acara keluarga",
  "Keperluan pribadi mendesak",
  "Perjalanan luar kota",
  "Rawat inap keluarga",
  "Pernikahan keluarga",
];

const statuses = ["Pending Manager", "Pending HR", "Pending Pimpinan", "Approved", "Rejected"];

// ======================================================
// HELPERS
// ======================================================

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate() {
  const start = new Date(2026, 0, 1);
  const end = new Date(2026, 11, 31);

  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function createDateRange() {
  const startDate = randomDate();
  const endDate = new Date(startDate);

  endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 10) + 1);

  const diffTime = endDate - startDate;
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return { startDate, endDate, totalDays };
}

function generateApprovalFlags(status) {
  return {
    approvedByManager: ["Pending HR", "Pending Pimpinan", "Approved"].includes(status),
    approvedByHR: ["Pending Pimpinan", "Approved"].includes(status),
  };
}

function generateRejectedReason(status) {
  if (status === "Rejected") {
    return "Tidak memenuhi syarat cuti / alasan tidak valid";
  }
  return "";
}

// ======================================================
// MAIN SEED
// ======================================================

async function seed() {
  try {
    const users = await User.find({ username: { $in: usernames } });

    if (!users.length) {
      console.log("User tidak ditemukan");
      process.exit();
    }

    const leaveTypes = await LeaveType.find({});

    if (!leaveTypes.length) {
      console.log("LeaveType tidak ditemukan");
      process.exit();
    }

    await Leave.deleteMany({});

    const data = [];

    for (const user of users) {
      for (let i = 0; i < 80; i++) {
        const status = randomItem(statuses);
        const { startDate, endDate, totalDays } = createDateRange();

        const flags = generateApprovalFlags(status);

        data.push({
          userId: user._id,
          type: randomItem(leaveTypes)._id,
          startDate,
          endDate,
          totalDays,
          reason: randomItem(reasons),
          file: Math.random() > 0.6 ? "/uploads/leaves/sample-attachment.pdf" : null,

          status,

          rejectedReason: generateRejectedReason(status),

          ...flags,

          createdAt: randomDate(),
          updatedAt: new Date(),
        });
      }
    }

    await Leave.insertMany(data);

    console.log("Seeder Leave berhasil dibuat");

    await mongoose.disconnect();
  } catch (err) {
    console.log(err);
    await mongoose.disconnect();
  }
}

seed();
