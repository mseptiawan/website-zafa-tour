import Payroll from "../models/payroll/Payroll.model.js";

import { Overtime } from "../models/Overtime.model.js";

import { attendanceHistory } from "./attendance.controller.js";
import Employee from "../models/employee/Employee.model.js";
/**
 * Controller untuk merender halaman Laporan Absensi (Akses: HRD/Management)
 */
export const renderAttendanceReportPage = async (req, res, next) => {
  try {
    const startDate = req.query.startDate || "2026-05-27";
    const endDate = req.query.endDate || "2026-06-26";

    const mockReq = {
      user: req.user,
      session: { user: req.user },
      query: {
        startDate,
        endDate,
        view: "all",
      },
    };

    // ─── TRICK SAKTI: BAJAK RES.RENDER AGAR TIDAK MEMBUKA PAGE LAMA ───
    const mockRes = {
      // Ketika fungsi asli memanggil res.render(), kita potong jalurnya di sini
      render: (viewPath, data) => {
        // Ambil data hasil kalkulasi fungsi asli, lalu paksa render ke file laporan BARU kita!
        return res.render("report/attendance", {
          title: "Laporan Absensi Karyawan",
          listAttendance: data.listAttendance, // Data list kiriman fungsi asli
          analytics: data.analytics, // Data totalLateMinutes, dll dari fungsi asli
          filters: {
            startDate,
            endDate,
          },
          user: req.user,
        });
      },
      // Jaga-jaga kalau fungsi asli lu pake res.status() atau res.json()
      status: function () {
        return this;
      },
      json: function (obj) {
        return res.json(obj);
      },
    };

    const mockNext = (err) => {
      if (err) console.error("⚠️ Log internal next attendance:", err);
    };

    // Panggil fungsi asli menggunakan mockRes pembajak kita
    await attendanceHistory(mockReq, mockRes, mockNext);
  } catch (error) {
    console.error("❌ Gagal merender laporan absensi:", error);
    return res.status(500).send("Terjadi masalah saat memuat laporan absensi.");
  }
};

export const getEmployeeReport = async (req, res) => {
  try {
    // Tarik semua data induk pegawai
    const employees = await Employee.find({});

    res.render("report/employee", {
      title: "Laporan Data Pegawai",
      employees, // <--- Dilepar ke file EJS di atas
    });
  } catch (error) {
    res.status(500).send("Eror menarik laporan pegawai");
  }
};

export const getOvertimeReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = {};

    // Saringan default: 30 hari terakhir jika form tidak diisi
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    filter.date = { $gte: start, $lte: end };

    // Tarik seluruh data lembur di rentang tanggal tersebut
    const listOvertime = await Overtime.find(filter).lean();

    // Kalkulasi agregasi murni sisi server untuk metrik atas
    let totalApprovedHours = 0;
    let totalApprovedCount = 0;
    let estimatedCost = 0;

    listOvertime.forEach((ot) => {
      // Kita hanya menghitung yang sudah sah / APPROVED
      if (ot.status === "APPROVED") {
        totalApprovedCount++;
        totalApprovedHours += ot.totalHours || 0;
        // Rumus beban biaya: Jam x Rate x Multiplier
        estimatedCost +=
          (ot.totalHours || 0) * (ot.overtimeRateSnapshot || 0) * (ot.multiplierSnapshot || 1.5);
      }
    });

    res.render("report/overtime", {
      title: "Laporan Aktivitas Lembur",
      listOvertime,
      analytics: {
        totalHours: totalApprovedHours,
        totalCount: totalApprovedCount,
        estimatedCost: Math.round(estimatedCost),
      },
      filters: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("❌ Eror Laporan Lembur:", error);
    res.status(500).send("Gagal memuat laporan aktivitas lembur");
  }
};

export const getPayrollReport = async (req, res) => {
  try {
    const { periodMonth } = req.query;

    // Default saringan ke bulan berjalan jika tidak ada filter (Format YYYY-MM)
    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const selectedPeriod = periodMonth || defaultPeriod;

    // Tarik data slip gaji yang sudah di-generate/tutup buku pada bulan tersebut
    // Kita pastikan mengambil yang statusnya CLOSED atau PAID[cite: 5]
    const listPayroll = await Payroll.find({
      periodMonth: selectedPeriod,
      status: { $in: ["CLOSED", "PAID"] },
    })
      .populate("employeeId")
      .lean();

    // Kalkulasi agregasi murni sisi server untuk metrik dashboard atas
    let totalEarnings = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    listPayroll.forEach((p) => {
      totalEarnings += p.totalEarnings || 0; // Akumulasi Bruto[cite: 5]
      totalDeductions += p.totalDeductions || 0; // Akumulasi Potongan[cite: 5]
      totalNet += p.netTakeHomePay || 0; // Akumulasi Bersih THP[cite: 5]
    });

    res.render("report/payroll", {
      title: "Laporan Beban Penggajian",
      listPayroll,
      analytics: {
        totalEmployees: listPayroll.length,
        totalEarnings,
        totalDeductions,
        totalNet,
      },
      filters: {
        periodMonth: selectedPeriod,
      },
    });
  } catch (error) {
    console.error("❌ Eror Laporan Payroll:", error);
    res.status(500).send("Gagal memuat laporan penggajian");
  }
};
