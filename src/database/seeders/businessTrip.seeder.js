import mongoose from "mongoose";
import dotenv from "dotenv";

import BusinessTrip from "../../models/BusinessTrip.model.js";
import User from "../../models/basic/User.js";

dotenv.config();

const usernames = ["basoherman", "ongkidwi", "sarwanto", "duwihartati", "ronaldrizky", "fadhilah"];

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

const purposes = ["KUNJUNGAN_SALES", "RAPAT", "PELATIHAN", "SURVEI", "LAINNYA"];

const requesterRoles = ["PEGAWAI", "MANAGER_ADMINISTRASI", "WAKIL_DIREKTUR", "MANAGER_KEUANGAN"];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBudget() {
  return Math.floor(Math.random() * 25000000) + 1000000;
}

function randomDate() {
  const start = new Date(2026, 0, 1);
  const end = new Date(2026, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function createDateRange() {
  const start = randomDate();
  const end = new Date(start);
  end.setDate(start.getDate() + Math.floor(Math.random() * 5) + 1);
  return { start, end };
}

function generateApprovals(status) {
  const approvals = [];

  if (status === "REJECTED") {
    approvals.push({
      step: "MANAGER_ADMINISTRASI",
      actor: "MANAGER_ADMINISTRASI",
      userId: new mongoose.Types.ObjectId(),
      status: "REJECTED",
      date: randomDate(),
      note: "Rejected by manager",
    });
    return approvals;
  }

  if (
    [
      "IN_REVIEW",
      "APPROVED",
      "PAYMENT_PROCESSING",
      "READY_TO_TRAVEL",
      "ON_TRIP",
      "SUBMITTED",
    ].includes(status)
  ) {
    approvals.push({
      step: "MANAGER_ADMINISTRASI",
      actor: "MANAGER_ADMINISTRASI",
      userId: new mongoose.Types.ObjectId(),
      status: "APPROVED",
      date: randomDate(),
      note: "",
    });
  }

  if (
    ["APPROVED", "PAYMENT_PROCESSING", "READY_TO_TRAVEL", "ON_TRIP", "SUBMITTED"].includes(status)
  ) {
    const delegated = Math.random() > 0.7;
    approvals.push({
      step: "DIREKTUR_UTAMA",
      actor: delegated ? "WAKIL_DIREKTUR" : "DIREKTUR_UTAMA",
      userId: new mongoose.Types.ObjectId(),
      status: "APPROVED",
      date: randomDate(),
      note: delegated ? "Approved via delegation" : "",
    });
  }

  return approvals;
}

function generatePayment(status) {
  const payment = {
    status: "PENDING",
    amount: randomBudget(),
    proof: null,
    paidAt: null,
    paidBy: null,
    note: "",
  };

  if (status === "PAYMENT_PROCESSING") {
    payment.status = "PROCESSING";
    return payment;
  }

  if (["READY_TO_TRAVEL", "ON_TRIP", "SUBMITTED"].includes(status)) {
    payment.status = "PAID";
    payment.proof = {
      filename: "payment-proof.pdf",
      url: "/uploads/files/payment-proof.pdf",
      uploadedAt: randomDate(),
    };
    payment.paidAt = randomDate();
    payment.paidBy = new mongoose.Types.ObjectId();
    return payment;
  }

  return payment;
}

function generateTripReport(status) {
  if (status !== "SUBMITTED") {
    return {
      isSubmitted: false,
      submittedAt: null,
      description: "",
      attachments: [],
    };
  }

  return {
    isSubmitted: true,
    submittedAt: randomDate(),
    description: "Perjalanan berhasil dilakukan dan meeting berjalan dengan baik.",
    attachments: [
      {
        filename: "laporan-perjalanan.pdf",
        url: "/uploads/files/laporan-perjalanan.pdf",
        mimetype: "application/pdf",
        size: 245000,
      },
    ],
  };
}

export default async function businessTripSeeder() {
  try {
    const users = await User.find({
      username: {
        $in: usernames,
      },
    });

    if (!users.length) {
      console.log("User tidak ditemukan");
    }

    await BusinessTrip.deleteMany({});

    const statuses = [
      "PENDING",
      "IN_REVIEW",
      "APPROVED",
      "REJECTED",
      "PAYMENT_PROCESSING",
      "READY_TO_TRAVEL",
      "ON_TRIP",
      "SUBMITTED",
    ];

    const data = [];

    for (const user of users) {
      for (let i = 0; i < 100; i++) {
        const status = randomItem(statuses);
        const { start, end } = createDateRange();

        const delegated =
          Math.random() > 0.8 &&
          ["APPROVED", "PAYMENT_PROCESSING", "READY_TO_TRAVEL", "ON_TRIP", "SUBMITTED"].includes(
            status
          );

        data.push({
          userId: user._id,
          requesterRole: randomItem(requesterRoles),
          title: randomItem(titles),
          purpose: randomItem(purposes),
          meetWith: randomItem(meetWithList),
          startDate: start,
          endDate: end,
          destination: randomItem(destinations),
          description: randomItem(descriptions),
          budget: randomBudget(),
          timeline: [
            {
              address: randomItem(destinations),
              order: 1,
            },
            {
              address: randomItem(destinations),
              order: 2,
            },
          ],
          status,
          currentStep:
            status === "PENDING"
              ? "MANAGER_ADMINISTRASI"
              : status === "IN_REVIEW"
                ? "DIREKTUR_UTAMA"
                : null,
          approvals: generateApprovals(status),
          delegation: delegated
            ? {
                active: true,
                from: "DIREKTUR_UTAMA",
                to: "WAKIL_DIREKTUR",
                delegatedBy: user._id,
                delegatedAt: randomDate(),
                note: "Auto delegation seeded",
              }
            : {
                active: false,
              },
          tripReport: generateTripReport(status),
          payment: generatePayment(status),
          createdAt: randomDate(),
          updatedAt: new Date(),
        });
      }
    }

    await BusinessTrip.insertMany(data);
    console.log("Seeder BusinessTrip berhasil dibuat");
  } catch (err) {
    console.log(err);
  }
}
