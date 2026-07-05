import mongoose from "mongoose";
import { Overtime } from "../../models/Overtime.model.js";
import Employee from "../../models/employee/Employee.model.js";
import User from "../../models/basic/User.model.js";
import EmployeeCareer from "../../models/employee/EmployeeCareer.js";
import Role from "../../models/basic/Role.model.js";
import Bidang from "../../models/basic/Bidang.model.js";

// Mengikuti aturan cut-off 28 s.d 27 bulan berikutnya
const PERIODS = [
  {
    id: "2026-05", // Siklus Mei
    start: new Date("2026-04-28T00:00:00Z"),
    end: new Date("2026-05-27T23:59:59Z"),
  },
  {
    id: "2026-06", // Siklus Juni
    start: new Date("2026-05-28T00:00:00Z"),
    end: new Date("2026-06-27T23:59:59Z"),
  },
  {
    id: "2026-07", // Siklus Juli
    start: new Date("2026-06-28T00:00:00Z"),
    end: new Date("2026-07-27T23:59:59Z"),
  },
];

const TARGET_USERNAMES = [
  "fajarjaniko",
  "adindarismayani",
  "abdulaziz",
  "meltisundari", // Manager Administrasi
  "basoherman", // Manager Haji Umrah
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate tanggal acak di luar hari Sabtu (6) dan Minggu (0)
const getRandomDateInPeriod = (start, end) => {
  let date;
  do {
    date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  } while (date.getUTCDay() === 0 || date.getUTCDay() === 6);
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
    // Menghapus data lembur lama pada periode Mei dan Juni agar tidak duplikat saat seeding ulang
    await Overtime.deleteMany({ payrollPeriodId: { $in: ["2026-05", "2026-06", "2026-07"] } });

    const defaultRoleMaster = await Role.findOne({ name: "WAKIL_DIREKTUR" });
    const defaultRoleName = defaultRoleMaster ? defaultRoleMaster.name : "WAKIL_DIREKTUR";

    const defaultBidangMaster =
      (await Bidang.findOne({ name: "Umum dan Perlengkapan" })) || (await Bidang.findOne());
    if (!defaultBidangMaster) throw new Error("Tidak ada data Bidang di database.");

    // Cari User Wakil Direktur sebagai fallback approver untuk Staff biasa
    const wadirUser = await User.findOne({ username: "duwihartati" });

    const overtimeRecords = [];

    for (const username of TARGET_USERNAMES) {
      const user = await User.findOne({ username }).populate("roleId");
      if (!user) continue;

      // ─── PERUBAHAN DI SINI ──────────────────────────────────────────
      // Langsung panggil Employee, rate lembur dibaca dari sub-document `financialData`
      const employee = await Employee.findOne({ userId: user._id });
      if (!employee) continue;

      const overtimeRate = employee.financialData?.overtimeRate || 25000;
      // ────────────────────────────────────────────────────────────────

      const career = await EmployeeCareer.findOne({ employee_id: employee._id }).populate({
        path: "bidangId",
        populate: { path: "managerRoleId" },
      });

      const bidangId = career?.bidangId?._id || defaultBidangMaster._id;
      const requiredManagerRole = career?.bidangId?.managerRoleId?.name || defaultRoleName;
      const roleName = user.roleId?.name?.toUpperCase() || "PEGAWAI";

      // Cek apakah user adalah Manager atau Wakil Direktur (Auto-Approved Rule)
      const isManagerOrWadir = roleName === "WAKIL_DIREKTUR" || roleName.startsWith("MANAGER_");

      // Lakukan loop untuk kedua periode (Mei dan Juni)
      for (const period of PERIODS) {
        // Setiap user akan mendapatkan 2 s.d 4 data lembur per bulannya
        const timesToOvertime = randomInt(2, 4);

        for (let i = 0; i < timesToOvertime; i++) {
          const workDate = getRandomDateInPeriod(period.start, period.end);
          workDate.setUTCHours(0, 0, 0, 0);

          const startHour = randomItem([17, 18]);
          const startMinute = randomItem(["00", "30"]);
          const durationHours = randomInt(1, 4);
          const endHour = startHour + durationHours;

          const startTime = `${startHour}:${startMinute}`;
          const endTime = `${endHour}:${startMinute}`;

          let approverId = null;
          let approvedAt = null;
          let historyAction = [];

          if (isManagerOrWadir) {
            // JIKA MANAGER: Auto Approved oleh diri sendiri
            approverId = user._id;
            approvedAt = workDate;
            historyAction = [
              {
                action: "SUBMITTED",
                by: user._id,
                role: roleName,
                note: "Izin lembur dinas manajemen",
                at: workDate,
              },
              {
                action: "APPROVED",
                by: user._id,
                role: roleName,
                note: "Sistem otomatis menyetujui pengajuan dinas lembur tingkat Manajemen Utama / Wakil Direktur.",
                at: workDate,
              },
            ];
          } else {
            // JIKA STAFF: Butuh approval Wadir atau Manager terkait
            approverId = wadirUser ? wadirUser._id : user._id;
            approvedAt = new Date(workDate.getTime() + 1000 * 60 * 60 * 12); // Approved 12 jam setelahnya
            historyAction = [
              {
                action: "SUBMITTED",
                by: user._id,
                role: roleName,
                note: "Selesai pengerjaan tugas tambahan, mohon approval pak/bu.",
                at: workDate,
              },
              {
                action: "APPROVED",
                by: approverId,
                role: wadirUser ? "WAKIL_DIREKTUR" : requiredManagerRole,
                note: "Lanjutkan, good job.",
                at: approvedAt,
              },
            ];
          }

          overtimeRecords.push({
            userId: user._id,
            employeeId: employee._id,
            employeeName: employee.fullName,
            date: workDate,
            startTime,
            endTime,
            totalHours: Number(durationHours.toFixed(2)),
            workDescription: randomItem(WORK_DESCRIPTIONS),
            result: "Pekerjaan diselesaikan dengan baik sesuai target.",
            location: {
              type: "OFFICE",
              detail: "Kantor Pusat Zafa Tour",
            },
            status: "APPROVED",
            approvedBy: approverId,
            approvedAt,
            payrollPeriodId: period.id,
            payrollStatus: "PENDING",
            overtimeRateSnapshot: overtimeRate,
            multiplierSnapshot: 1.5,
            bidangId,
            requiredManagerRole,
            approvalHistory: historyAction,
          });
        }
      }
    }

    if (overtimeRecords.length > 0) {
      await Overtime.insertMany(overtimeRecords);
      console.log(
        `[SUCCESS] Berhasil menginput ${overtimeRecords.length} sampel data lembur untuk periode Mei & Juni 2026.`
      );
    } else {
      console.log("[WARN] Tidak ada data lembur yang berhasil di-generate.");
    }
  } catch (error) {
    console.error("[ERROR] Seeder Lembur Gagal:", error);
    throw error;
  }
};

export default seedOvertime;
