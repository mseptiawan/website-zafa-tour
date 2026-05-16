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

const meetWithList = [
  "PT Mitra Sejahtera",
  "CV Sumber Rejeki",
  "Bank Mandiri Cabang",
  "Dinas Perdagangan",
  "Client Retail Partner",
];

const descriptions = [
  "Kunjungan untuk membahas kerja sama bisnis",
  "Meeting dengan client terkait project",
  "Training internal perusahaan",
  "Survey lokasi cabang baru",
];

const purposes = ["SALES_VISIT", "MEETING", "TRAINING", "SURVEY", "OTHER"];

const roles = ["KARYAWAN", "MANAGER", "HR", "KEUANGAN"];

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

function fixDateRange() {
  const start = randomDate();
  const end = new Date(start);
  end.setDate(start.getDate() + Math.floor(Math.random() * 5) + 1);
  return { start, end };
}

// =========================
// APPROVAL GENERATOR (UPDATED)
// =========================
function generateApprovals(status) {
  const approvals = [];

  if (status === "REJECTED") {
    return [
      {
        step: "MANAGER",
        actor: "MANAGER",
        userId: new mongoose.Types.ObjectId(),
        status: "REJECTED",
        date: randomDate(),
        note: "Rejected by manager",
      },
    ];
  }

  if (
    ["IN_REVIEW", "APPROVED", "PAYMENT_PROCESSING", "PAID", "ON_TRIP", "SUBMITTED"].includes(status)
  ) {
    approvals.push({
      step: "MANAGER",
      actor: "MANAGER",
      userId: new mongoose.Types.ObjectId(),
      status: "APPROVED",
      date: randomDate(),
      note: "",
    });
  }

  if (["APPROVED", "PAYMENT_PROCESSING", "PAID", "ON_TRIP", "SUBMITTED"].includes(status)) {
    const useDelegation = Math.random() > 0.7;

    approvals.push({
      step: "PIMPINAN",
      actor: useDelegation ? "HR" : "PIMPINAN",
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

  const statusPool = [
    "PENDING",
    "IN_REVIEW",
    "APPROVED",
    "REJECTED",
    "PAYMENT_PROCESSING",
    "PAID",
    "ON_TRIP",
    "SUBMITTED",
  ];

  const data = [];

  for (const user of users) {
    for (let i = 0; i < 30; i++) {
      const status = randomItem(statusPool);
      const { start, end } = fixDateRange();
      const requesterRole = randomItem(roles);

      const isDelegated = Math.random() > 0.8 && status !== "PENDING";

      data.push({
        userId: user._id,
        requesterRole,

        title: randomItem(titles),
        purpose: randomItem(purposes),
        meetWith: randomItem(meetWithList),

        startDate: start,
        endDate: end,

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

        delegation: isDelegated
          ? {
              active: true,
              from: "PIMPINAN",
              to: "HR",
              delegatedBy: user._id,
              delegatedAt: randomDate(),
              note: "Auto seeded delegation",
            }
          : {
              active: false,
            },

        tripReport: {
          isSubmitted: status === "SUBMITTED",
          submittedAt: status === "SUBMITTED" ? randomDate() : null,
          description: status === "SUBMITTED" ? "Laporan perjalanan dinas" : "",
          attachments: [],
        },

        payment: {
          status:
            status === "PAID" ? "PAID" : status === "PAYMENT_PROCESSING" ? "PROCESSING" : "PENDING",

          amount: 0,

          paidAt: status === "PAID" ? randomDate() : null,
          paidBy: null,
          note: "",
        },

        createdAt: randomDate(),
        updatedAt: new Date(),
      });
    }
  }

  await BusinessTrip.insertMany(data);

  console.log("Seeder updated sesuai schema terbaru");

  await mongoose.disconnect();
}

seed();
