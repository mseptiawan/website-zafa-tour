import dotenv from "dotenv";

import Overtime from "../../models/Overtime.model.js";
import Employee from "../../models/employee/Employee.model.js";
import User from "../../models/basic/User.js";

dotenv.config();

const descriptions = [
  "Menyelesaikan laporan bulanan",
  "Perbaikan bug sistem HRIS",
  "Input data Pegawai",
  "Maintenance server internal",
  "Rekap absensi pegawai",
];

const results = [
  "Pekerjaan berhasil diselesaikan",
  "Bug berhasil diperbaiki",
  "Data berhasil diperbarui",
];

const statuses = ["Approved", "Rejected", "Pending Manager"];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate() {
  const start = new Date(2026, 3, 1);
  const end = new Date(2026, 4, 30);

  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export default async function overtimeSeeder() {
  const employees = await Employee.find().populate("userId");

  if (employees.length === 0) {
    console.log("Employee tidak ditemukan");

    return;
  }

  await Overtime.deleteMany();

  const data = [];

  for (let i = 0; i < 50; i++) {
    const employee = randomItem(employees);

    const totalHours = Math.floor(Math.random() * 4) + 1;

    const startHour = Math.floor(Math.random() * 5) + 17;

    const endHour = startHour + totalHours;

    const status = randomItem(statuses);

    data.push({
      userId: employee.userId._id,

      employeeName: employee.fullName,

      date: randomDate(),

      startTime: `${String(startHour).padStart(2, "0")}:00`,

      endTime: `${String(endHour).padStart(2, "0")}:00`,

      totalHours,

      workDescription: randomItem(descriptions),

      result: randomItem(results),

      proofFile: null,

      approvedByManager: status === "Approved",

      status,

      createdAt: randomDate(),

      updatedAt: new Date(),
    });
  }

  await Overtime.insertMany(data);

  console.log("Seeder lembur berhasil");
}
