import mongoose from "mongoose";
import Employee from "../models/employee/Employee.model.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.js";
import { Overtime } from "../models/Overtime.model.js";
import EmployeeFinancial from "../models/employee/EmployeeFinancial.js";
import { getPayrollPeriod } from "../utils/payrollPeriod.js";

export const createOvertimeService = async ({ user, body, file }) => {
  const rawDate = new Date(body.date);
  const workDate = new Date(Date.UTC(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate()));

  // 1. Deklarasikan waktu mulai dan selesai
  const start = new Date(`${body.date}T${body.startTime}:00Z`);
  let end = new Date(`${body.date}T${body.endTime}:00Z`);

  // 2. FIX CROSS-DAY BUG: Jika jam selesai < jam mulai, artinya melewati tengah malam (pindah hari)
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }

  // 3. Hitung total jam setelah mengamankan kondisi lintas hari
  const totalHours = (end - start) / (1000 * 60 * 60);
  const period = getPayrollPeriod(workDate);

  if (!period?.id) {
    throw new Error("Payroll period invalid");
  }

  const employeeId = user.employeeId;
  if (!employeeId) {
    throw new Error("Employee ID tidak ditemukan di session");
  }

  // 4. Inisialisasi variabel state awal lembur
  let status = "SUBMITTED";
  let approvedBy = null;
  let approvedAt = null;
  let overtimeRateSnapshot = undefined;
  let multiplierSnapshot = undefined;
  let requiredManagerRole = null;
  let bidangId = null;

  // Variabel penampung ID Employee yang benar-benar valid untuk query berikutnya
  let activeEmployeeId = employeeId;

  const historyAction = [];

  // 5. DEFENSIVE BYPASS: Cek apakah user adalah WAKIL_DIREKTUR atau ber-role MANAGER_*
  const isWadirOrManager =
    user.role === "WAKIL_DIREKTUR" || (user.role || "").startsWith("MANAGER_");

  if (isWadirOrManager) {
    // Jalankan skenario bypass Auto-Approved tanpa validasi atasan/managerRoleId
    status = "APPROVED";
    approvedBy = user._id;
    approvedAt = new Date();

    // 1. Ambil data financial manager dengan pengaman (Cek Employee ID atau User ID)
    let financial = await EmployeeFinancial.findOne({
      employee_id: new mongoose.Types.ObjectId(employeeId),
    });

    // 2. JIKA SINKRONISASI SESSION TERBALIK (Membawa User ID bukan Employee ID):
    if (!financial) {
      const fallbackEmployee = await Employee.findOne({ userId: user._id });

      if (fallbackEmployee) {
        activeEmployeeId = fallbackEmployee._id; // Update ID aktif ke ID Employee yang benar
        financial = await EmployeeFinancial.findOne({
          employee_id: fallbackEmployee._id,
        });
      }
    }

    // 3. JIKA BENAR-BENAR TIDAK KETEMU DI KEDUA SKENARIO:
    if (!financial) {
      console.warn(
        `[WARN] Data finansial tidak ditemukan untuk EmployeeID: ${employeeId} maupun UserID: ${user._id}. Menggunakan rate default 0.`
      );
      overtimeRateSnapshot = 0;
    } else {
      overtimeRateSnapshot = financial.overtimeRate || 0;
    }

    multiplierSnapshot = 1.5;

    // Tarik data bidang dasar dari EmployeeCareer menggunakan ID Employee yang valid
    const basicCareer = await EmployeeCareer.findOne({ employee_id: activeEmployeeId });

    bidangId = basicCareer?.bidangId || null;

    // FIX JIKA MANAJEMEN BELUM PUNYA BIDANG:
    if (!bidangId) {
      console.warn(
        `[WARN] ${user.fullName} tidak punya bidang di Karir. Mencari bidang default dari database...`
      );

      // Ambil contoh ID bidang pertama apa saja yang ada di database kamu agar lolos dari 'required validation'
      const sampleBidang = await mongoose.model("Bidang").findOne({});

      if (sampleBidang) {
        bidangId = sampleBidang._id;
      } else {
        throw new Error(
          `Gagal memproses lembur. Tidak ada satu pun data Bidang yang ditemukan di database untuk dijadikan fallback.`
        );
      }
    }

    requiredManagerRole = user.role; // Set target role ke dirinya sendiri agar konsisten

    // Catat log gabungan (SUBMITTED & AUTO APPROVED)
    historyAction.push(
      {
        action: "SUBMITTED",
        by: user._id,
        role: user.role,
        at: new Date(),
      },
      {
        action: "APPROVED",
        by: user._id,
        role: user.role,
        note: "Sistem otomatis menyetujui pengajuan dinas lembur tingkat Manajemen Utama / Wakil Direktur.",
        at: new Date(),
      }
    );
  } else {
    // 6. SKENARIO PEGAWAI BIASA: Tetap lakukan penelusuran hierarki atasan
    const career = await EmployeeCareer.findOne({
      employee_id: employeeId,
    }).populate({
      path: "bidangId",
      populate: {
        path: "managerRoleId",
      },
    });

    if (!career?.bidangId?.managerRoleId?.name) {
      throw new Error("Employee career/bidang/manager tidak ditemukan");
    }

    bidangId = career.bidangId._id;
    requiredManagerRole = career.bidangId.managerRoleId.name;

    historyAction.push({
      action: "SUBMITTED",
      by: user._id,
      role: user.role,
      at: new Date(),
    });
  }

  // 7. Simpan data akhir ke MongoDB
  return await Overtime.create({
    userId: user._id,
    employeeId: activeEmployeeId, // Menggunakan ID Karyawan yang sinkron
    employeeName: user.fullName,
    date: workDate,
    startTime: body.startTime,
    endTime: body.endTime,
    totalHours: Number(totalHours.toFixed(2)),
    workDescription: body.workDescription.trim(),
    result: body.result?.trim() || "",
    location: body.location,
    proofFile: file ? file.filename : null,
    status,
    payrollPeriodId: period.id,
    payrollStatus: "PENDING",
    bidangId,
    requiredManagerRole,
    overtimeRateSnapshot,
    multiplierSnapshot,
    approvedBy,
    approvedAt,
    approvalHistory: historyAction,
  });
};
