import mongoose from "mongoose";
import dotenv from "dotenv";

import BusinessTrip from "../../models/BusinessTrip.js";
import Employee from "../../models/Employee.js";
import User from "../../models/User.js";

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

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
  "Meeting dengan pihak client terkait project baru",
  "Training internal terkait sistem perusahaan",
  "Survey lokasi untuk pembukaan cabang baru",
];

const purposes = ["SALES_VISIT", "MEETING", "TRAINING", "SURVEY", "OTHER"];

const statuses = ["PENDING", "APPROVED_MANAGER", "APPROVED_DIRECTOR", "REJECTED"];

// =========================
// HELPER
// =========================
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate() {
  const start = new Date(2026, 3, 1);
  const end = new Date(2026, 4, 30);

  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomTimeline() {
  const places = ["Kantor Pusat", "Cabang A", "Cabang B", "Client Office", "Hotel Meeting Room"];

  const count = Math.floor(Math.random() * 4) + 1;

  return Array.from({ length: count }).map((_, i) => ({
    address: randomItem(places),
    note: "Checkpoint kunjungan",
    time: `${String(8 + i * 2).padStart(2, "0")}:00`,
    order: i + 1,
  }));
}

// =========================
// SEED FUNCTION
// =========================
async function seed() {
  const employees = await Employee.find().populate("userId");

  if (!employees.length) {
    console.log("Employee tidak ditemukan");
    process.exit();
  }

  await BusinessTrip.deleteMany();

  const data = [];

  for (let i = 0; i < 50; i++) {
    const employee = randomItem(employees);

    const startDate = randomDate();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 3) + 1);

    const status = randomItem(statuses);

    const base = {
      userId: employee.userId._id,

      title: randomItem(titles),

      startDate,
      endDate,

      destination: randomItem(destinations),

      description: randomItem(descriptions),

      budget: Math.floor(Math.random() * 50000000) + 1000000,

      purpose: randomItem(purposes),

      contactName: employee.fullName,
      contactPhone: "08" + Math.floor(1000000000 + Math.random() * 8999999999),

      timeline: randomTimeline(),

      status,

      createdAt: randomDate(),
      updatedAt: new Date(),
    };

    // =========================
    // APPROVAL LOGIC
    // =========================
    if (status === "APPROVED_MANAGER") {
      base.approvedByManager = {
        userId: employee.userId._id,
        date: new Date(),
      };
    }

    if (status === "APPROVED_DIRECTOR") {
      base.approvedByManager = {
        userId: employee.userId._id,
        date: new Date(),
      };

      base.approvedByDirector = {
        userId: employee.userId._id,
        date: new Date(),
      };
    }

    data.push(base);
  }

  await BusinessTrip.insertMany(data);

  console.log("Seeder BusinessTrip berhasil");

  mongoose.disconnect();
}

seed();
