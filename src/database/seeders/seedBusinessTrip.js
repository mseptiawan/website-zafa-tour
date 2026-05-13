import mongoose from "mongoose";
import dotenv from "dotenv";

import BusinessTrip from "../../models/BusinessTrip.js";
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
  "Kunjungan Sales Area",
  "Meeting Client Project",
  "Training Produk Baru",
  "Survey Lokasi Cabang",
  "Negosiasi Kerja Sama",
];

const destinations = ["Jakarta", "Bandung", "Surabaya", "Palembang", "Yogyakarta", "Medan"];

const descriptions = [
  "Kunjungan untuk membahas kerja sama bisnis",
  "Meeting dengan client terkait project",
  "Training internal perusahaan",
  "Survey lokasi cabang baru",
];

const purposes = ["SALES_VISIT", "MEETING", "TRAINING", "SURVEY", "OTHER"];

// =========================
// HELPERS
// =========================
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate() {
  const start = new Date(2026, 3, 1);
  const end = new Date(2026, 4, 30);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// =========================
// APPROVAL GENERATOR
// =========================
function generateApprovals(status) {
  const approvals = [];

  // manager always exists if not PENDING
  if (status !== "PENDING") {
    approvals.push({
      role: "MANAGER",
      actingAs: "MANAGER",
      userId: new mongoose.Types.ObjectId(),
      status: "APPROVED",
      date: randomDate(),
    });
  }

  // IN_REVIEW = stuck di director step
  if (status === "IN_REVIEW") {
    return approvals;
  }

  // REJECTED at manager level
  if (status === "REJECTED") {
    return [
      {
        role: "MANAGER",
        actingAs: "MANAGER",
        userId: new mongoose.Types.ObjectId(),
        status: "REJECTED",
        date: randomDate(),
      },
    ];
  }

  // APPROVED full flow
  if (status === "APPROVED") {
    const useDelegation = Math.random() > 0.6;

    approvals.push({
      role: "PIMPINAN",
      actingAs: useDelegation ? "HR" : "PIMPINAN",
      userId: new mongoose.Types.ObjectId(),
      status: "APPROVED",
      date: randomDate(),
      note: useDelegation ? "Approved via HR delegation" : "",
    });
  }

  return approvals;
}

// =========================
// MAIN SEED
// =========================
async function seed() {
  const users = await User.find({
    username: { $in: usernames },
  });

  if (!users.length) {
    console.log("User tidak ditemukan");
    process.exit();
  }

  await BusinessTrip.deleteMany({});

  const data = [];

  for (const user of users) {
    for (let i = 0; i < 30; i++) {
      const statusPool = ["PENDING", "IN_REVIEW", "APPROVED", "REJECTED"];
      const status = randomItem(statusPool);

      const base = {
        userId: user._id,

        title: randomItem(titles),
        purpose: randomItem(purposes),

        startDate: randomDate(),
        endDate: randomDate(),

        destination: randomItem(destinations),
        description: randomItem(descriptions),

        budget: Math.floor(Math.random() * 25000000) + 1000000,

        timeline: [
          {
            address: randomItem(destinations),
            order: 1,
          },
        ],

        status,

        currentStep: status === "PENDING" ? "MANAGER" : status === "IN_REVIEW" ? "PIMPINAN" : null,

        approvals: generateApprovals(status),

        delegation:
          Math.random() > 0.8
            ? {
                from: "PIMPINAN",
                to: "HR",
                active: true,
                createdAt: randomDate(),
              }
            : null,

        createdAt: randomDate(),
        updatedAt: new Date(),
      };

      data.push(base);
    }
  }

  await BusinessTrip.insertMany(data);

  console.log("Seeder HRIS COMPLETE (30 per user, full workflow)");

  mongoose.disconnect();
}

seed();
