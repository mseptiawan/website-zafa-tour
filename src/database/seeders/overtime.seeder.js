import mongoose from "mongoose";
import { Overtime } from "../../models/Overtime.model.js";
import Employee from "../../models/employee/Employee.model.js";
import User from "../../models/basic/User.model.js";
import EmployeeFinancial from "../../models/employee/EmployeeFinancial.js";
import EmployeeCareer from "../../models/employee/EmployeeCareer.js";
import Role from "../../models/basic/Role.model.js";
import Bidang from "../../models/basic/Bidang.model.js";

// ─── FIX 1: SESUAIKAN TANGGAL MASUK KE SIKLUS PAYROLL JUNI 2026 ───
const START_DATE = new Date("2026-05-27T00:00:00Z");
const END_DATE = new Date("2026-06-25T23:59:59Z");

const TARGET_EMPLOYEES = ["Abdul Aziz", "Ongki Dwi", "Fajar Janiko"];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getRandomDate = () => {
  const date = new Date(
    START_DATE.getTime() + Math.random() * (END_DATE.getTime() - START_DATE.getTime())
  );
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return date;
};

const WORK_DESCRIPTIONS = [
  "Rekapitulasi laporan bulanan dan closing jurnal",
  "Follow up client VIP Zafa Tour untuk keberangkatan bulan depan",
  "Maintenance server HRIS dan perbaikan bug minor",
  "Persiapan dokumen legalitas dan kelengkapan tender",
  "Meeting koordinasi divisi teknis di luar jam kerja",
  "Audit data inventaris kantor pusat",
  "Menyelesaikan desain materi promosi untuk social media",
];

const seedOvertime = async () => {
  try {
    // Bersihkan dulu data lemburan lama biar ga numpuk double
    await Overtime.deleteMany({ payrollPeriodId: "2026-06" });

    const defaultRoleMaster = await Role.findOne({ name: "WAKIL_DIREKTUR" });
    const defaultRoleName = defaultRoleMaster ? defaultRoleMaster.name : "WAKIL_DIREKTUR";

    const defaultBidangMaster =
      (await Bidang.findOne({ name: "Umum dan Perlengkapan" })) || (await Bidang.findOne());
    if (!defaultBidangMaster) throw new Error("Tidak ada data Bidang sama sekali di database.");

    const overtimeRecords = [];

    for (const empName of TARGET_EMPLOYEES) {
      const employee = await Employee.findOne({ fullName: empName });
      if (!employee) continue;

      const user = await User.findById(employee.userId);
      if (!user) continue;

      const financial = await EmployeeFinancial.findOne({ employee_id: employee._id });
      const overtimeRate = financial?.overtimeRate || 25000;

      const career = await EmployeeCareer.findOne({ employee_id: employee._id }).populate({
        path: "bidangId",
        populate: { path: "managerRoleId" },
      });

      const bidangId = career?.bidangId?._id || defaultBidangMaster._id;
      const requiredManagerRole = career?.bidangId?.managerRoleId?.name || defaultRoleName;

      // Cari approver pake fallback aman
      let approver = await User.findOne({ username: "wadir" }); // sesuaikan username akun wadir asli lu
      if (!approver) approver = await User.findOne({}); // fallback ambil user pertama gpp buat bypass seeder

      const timesToOvertime = randomInt(2, 4);

      for (let i = 0; i < timesToOvertime; i++) {
        const workDate = getRandomDate();
        workDate.setUTCHours(0, 0, 0, 0);

        const startHour = randomItem([17, 18]);
        const startMinute = randomItem(["00", "30"]);
        const durationHours = randomInt(1, 4);
        const endHour = startHour + durationHours;

        const startTime = `${startHour}:${startMinute}`;
        const endTime = `${endHour}:${startMinute}`;
        const totalHours = durationHours;
        const payrollPeriodId = "2026-06";

        overtimeRecords.push({
          userId: user._id,
          employeeId: employee._id,
          employeeName: employee.fullName,
          date: workDate, // Tanggal real sekarang berada di antara 27 Mei - 25 Juni
          startTime,
          endTime,
          totalHours,
          workDescription: randomItem(WORK_DESCRIPTIONS),
          result: "Pekerjaan selesai sesuai target, lampiran dikirim via email.",
          location: {
            type: "OFFICE",
            detail: "Kantor Pusat Zafa Tour",
          },
          status: "APPROVED", // <--- WAJIB APPROVED BIAR MASUK HITUNGAN PAYROLL
          approvedBy: approver._id,
          approvedAt: new Date(workDate.getTime() + 1000 * 60 * 60 * 24),
          payrollPeriodId,
          periodMonth: payrollPeriodId, // ─── FIX 2: SINKRONKAN KEDUA NAMA FIELD NYA BIAR AMAN ───
          payrollStatus: "PENDING",
          overtimeRateSnapshot: overtimeRate,
          multiplierSnapshot: 1.5,
          bidangId,
          requiredManagerRole,
          approvalHistory: [
            {
              action: "SUBMITTED",
              by: user._id,
              role: user.role,
              note: "Izin lembur bos",
              at: workDate,
            },
            {
              action: "APPROVED",
              by: approver._id,
              role: approver.role,
              note: "Lanjutkan, good job.",
              at: new Date(workDate.getTime() + 1000 * 60 * 60 * 24),
            },
          ],
        });
      }
    }

    if (overtimeRecords.length > 0) {
      await Overtime.insertMany(overtimeRecords);
      console.log(`✅ Berhasil membuat ${overtimeRecords.length} data lembur siklus Juni 2026.`);
    } else {
      console.log("0 data masuk.");
    }
  } catch (error) {
    console.error("Seeder Lembur Gagal:", error);
    throw error;
  }
};

export default seedOvertime;
