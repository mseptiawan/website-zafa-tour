import Leave from "../models/leave/Leave.model.js";
import LeaveApproval from "../models/leave/LeaveApproval.model.js";
import LeaveType from "../models/leave/LeaveType.model.js";
import User from "../models/User.js";
import Holiday from "../models/calender/Holiday.model.js";
import LeaveBalance from "../models/leave/LeaveBalance.model.js";
import Role from "../models/Role.js";
import LeaveCancellation from "../models/leave/LeaveCancellation.model.js";
// Definisi Alur Persetujuan berdasarkan Role Pemohon
const WORKFLOW = {
  STAFF: ["MANAGER", "HR"],
  KEUANGAN: ["MANAGER", "HR"],
  MANAGER: ["HR"],
  GENERAL_MANAGER: ["HR"],
  HR: ["PIMPINAN"],
  PIMPINAN: [],
};
const calculateWorkDays = async (start, end) => {
  // 1. Cleansing Jam agar komparasi objek Date akurat 100%
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  if (endDate < startDate) return 0;

  // 2. Ambil semua agenda libur AKTIF yang tumpang tindih dengan rentang tanggal pengajuan cuti
  const holidays = await Holiday.find({
    isActive: true, // Pastikan yang aktif (tidak diarsip)
    $or: [
      // Kondisi A: Tanggal libur berada di dalam rentang pengajuan cuti
      { date: { $gte: startDate, $lte: endDate } },
      // Kondisi B: Selesai libur berada di dalam rentang pengajuan cuti
      { endDate: { $gte: startDate, $lte: endDate } },
      // Kondisi C: Rentang libur membungkus penuh rentang pengajuan cuti
      { date: { $lte: startDate }, endDate: { $gte: endDate } },
    ],
  });

  // 3. Petakan semua tanggal libur ke dalam format Set string 'YYYY-MM-DD' untuk lookup cepat
  const holidayDatesSet = new Set();

  holidays.forEach((h) => {
    const hStart = new Date(h.date);
    hStart.setHours(0, 0, 0, 0);

    // Jika tidak ada endDate (libur cuma 1 hari), jadikan hStart sebagai batas akhirnya
    const hEnd = h.endDate ? new Date(h.endDate) : new Date(h.date);
    hEnd.setHours(0, 0, 0, 0);

    let loopDate = new Date(hStart);
    while (loopDate <= hEnd) {
      holidayDatesSet.add(loopDate.toISOString().split("T")[0]);
      loopDate.setDate(loopDate.getDate() + 1);
    }
  });

  // 4. Hitung Hari Kerja Bersih
  let count = 0;
  let curDate = new Date(startDate);

  while (curDate <= endDate) {
    const dateStr = curDate.toISOString().split("T")[0];
    const dayOfWeek = curDate.getDay(); // 0 = Minggu, 6 = Sabtu

    // Evaluasi aturan filter
    const isSunday = dayOfWeek === 0; // Minggu libur (Sabtu tetap masuk)
    const isHoliday = holidayDatesSet.has(dateStr);

    // Kriteria hari kerja: Bukan hari minggu DAN bukan tanggal cuti bersama/libur nasional
    if (!isSunday && !isHoliday) {
      count++;
    }

    curDate.setDate(curDate.getDate() + 1);
  }

  return count;
};

export const calculateLeaveDays = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Parameter tanggal tidak lengkap",
      });
    }

    // Panggil helper di atas
    const totalDays = await calculateWorkDays(startDate, endDate);

    return res.status(200).json({
      success: true,
      totalDays: totalDays,
    });
  } catch (error) {
    console.error("Error calculating leave days:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const getHolidaysPage = async (req, res) => {
  try {
    const userRole = req.user.role;
    let query = {};

    // Filter data pengajuan agar approver hanya melihat data yang melibatkan mereka
    if (["MANAGER", "HR", "PIMPINAN"].includes(userRole)) {
      const structuralApprovals = await LeaveApproval.find({ approverId: req.user._id });
      const leaveIds = structuralApprovals.map((app) => app.leaveId);
      query = { _id: { $in: leaveIds } };
    }

    // 1. Ambil data pengajuan cuti masal
    const allLeaves = await Leave.find(query)
      .populate("leaveTypeId", "name")
      .populate({ path: "userId", populate: { path: "employeeData", select: "fullName" } })
      .sort({ createdAt: -1 });

    // Pisahkan data pengajuan aktif vs selesai
    const activeLeaves = allLeaves.filter((leave) => leave.status === "PENDING");
    const historyLeaves = allLeaves.filter((leave) => leave.status !== "PENDING");

    // 2. Ambil data Kalender Libur (untuk tahun ini)
    const currentYear = new Date().getFullYear();
    const selectedYear = req.query.year ? parseInt(req.query.year) : currentYear;

    const holidays = await Holiday.find({
      $or: [{ year: selectedYear }, { isRecurring: true }],
    }).sort({ date: 1 });

    // SOLUSI: Arahkan ke file views/leave/manage-center.ejs yang menyatukan semua tab
    res.render("leave/manage-center", {
      title: "Pusat Manajemen Cuti",
      user: req.user,
      activeLeaves,
      historyLeaves,
      holidays,
      selectedYear,
    });
  } catch (error) {
    // PERBAIKAN: Tambahkan properti title agar tidak crash saat error
    return res.status(500).render("error", {
      title: "Kalender Manajemen - Error",
      message: error.message,
    });
  }
};

export const createHoliday = async (req, res) => {
  try {
    const { name, date, endDate, type, isDeductLeave, description } = req.body;

    const parsedDate = new Date(date);
    const year = parsedDate.getFullYear();

    // ======================================================================
    // 1. ATURAN PENGETATAN BACKEND: Validasi Paksa Nilai isDeductLeave
    // ======================================================================
    let finalIsDeductLeave = false;

    if (type === "COMPANY") {
      // Internal Perusahaan WAJIB mutlak memotong jatah cuti karyawan
      finalIsDeductLeave = true;
    } else if (type === "NATIONAL") {
      // Nasional HARAM memotong jatah cuti karyawan
      finalIsDeductLeave = false;
    } else if (type === "RELIGIOUS") {
      // Keagamaan mengikuti kiriman data dari checkbox UI Admin (karena opsional)
      finalIsDeductLeave = isDeductLeave === "true" || isDeductLeave === true;
    }

    // 2. Simpan agenda baru ke database MongoDB
    const newHoliday = await Holiday.create({
      name,
      date: parsedDate,
      endDate: endDate ? new Date(endDate) : null,
      type,
      isDeductLeave: finalIsDeductLeave,
      description,
      year,
    });

    // ======================================================================
    // 3. TRIGGER MASSAL: Potong Saldo Karyawan jika Agenda Memotong Cuti
    // ======================================================================
    if (finalIsDeductLeave === true) {
      console.log(
        `⚠️ Mendeteksi Cuti Baru [${name}] memotong kuota. Memperbarui saldo seluruh karyawan tahun ${year}...`
      );

      // Kurangi sisa kuota (remaining) dan naikkan jatah terpakai (used) sebanyak 1 hari
      await LeaveBalance.updateMany(
        { year: year },
        {
          $inc: { remaining: -1, used: 1 },
        }
      );
    }

    // Kembali ke halaman utama manajemen kalender dengan mempertahankan tab aktif via query
    return res.redirect("/leave/manage-calendar?tab=calendar");
  } catch (error) {
    console.error("Error Create Holiday:", error);
    return res.status(500).render("error", {
      title: "Tambah Agenda - Error",
      message: error.message,
    });
  }
};

export const updateHoliday = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res
        .status(403)
        .json({ success: false, message: "Akses ditolak. Hanya HR yang dapat mengubah kalender." });
    }

    const { id } = req.params;
    const { name, date, endDate, type, isDeductLeave, description } = req.body;

    // 1. Ambil data lama sebelum di-update untuk keperluan pengecekan saldo
    const oldHoliday = await Holiday.findById(id);
    if (!oldHoliday) {
      return res
        .status(404)
        .render("error", { title: "Error", message: "Agenda tidak ditemukan." });
    }

    // 2. Cleansing Tanggal Baru & Hitung Jumlah Hari Baru
    const parsedStartDate = new Date(date);
    parsedStartDate.setHours(0, 0, 0, 0);
    const year = parsedStartDate.getFullYear();

    const parsedEndDate = endDate ? new Date(endDate) : new Date(date);
    parsedEndDate.setHours(0, 0, 0, 0);

    const diffTimeNew = Math.abs(parsedEndDate - parsedStartDate);
    const totalDaysNew = Math.ceil(diffTimeNew / (1000 * 60 * 60 * 24)) + 1;

    // 3. Hitung Jumlah Hari Lama (Dari Data Database)
    const oldStart = new Date(oldHoliday.date);
    const oldEnd = oldHoliday.endDate ? new Date(oldHoliday.endDate) : new Date(oldHoliday.date);
    const diffTimeOld = Math.abs(oldEnd - oldStart);
    const totalDaysOld = Math.ceil(diffTimeOld / (1000 * 60 * 60 * 24)) + 1;

    // 4. Aturan Pengetatan Kategori Cuti Baru
    let finalIsDeductLeave = false;
    if (type === "COMPANY") {
      finalIsDeductLeave = true;
    } else if (type === "NATIONAL") {
      finalIsDeductLeave = false;
    } else if (type === "RELIGIOUS") {
      finalIsDeductLeave = isDeductLeave === "true" || isDeductLeave === true;
    }

    // ======================================================================
    // 5. INTEGRASI LOGIC SALDO (BANDINGKAN KONDISI LAMA VS BARU)
    // ======================================================================
    // Catatan: Sinkronisasi saldo hanya berjalan jika agenda ini berstatus AKTIF (tidak diarsip)
    if (oldHoliday.isActive) {
      const wasDeduct = oldHoliday.isDeductLeave === true;
      const isNowDeduct = finalIsDeductLeave === true;

      if (!wasDeduct && isNowDeduct) {
        // Skenario A: Tadinya tidak memotong, sekarang memotong -> Potong jatah massal sebesar hari baru
        await LeaveBalance.updateMany(
          { year: year },
          { $inc: { remaining: -totalDaysNew, used: totalDaysNew } }
        );
      } else if (wasDeduct && !isNowDeduct) {
        // Skenario B: Tadinya memotong, sekarang tidak memotong -> Refund jatah massal sebesar hari lama
        await LeaveBalance.updateMany(
          { year: oldHoliday.year },
          { $inc: { remaining: totalDaysOld, used: -totalDaysOld } }
        );
      } else if (wasDeduct && isNowDeduct) {
        // Skenario C: Tetap memotong, tapi kemungkinan jumlah harinya berubah (misal dari 1 hari jadi 3 hari)
        // Hitung selisih harinya: (Lama - Baru)
        // Jika dari 1 hari jadi 3 hari -> (1 - 3 = -2), jatah sisa berkurang 2 hari. Pas!
        const dayDifference = totalDaysOld - totalDaysNew;
        if (dayDifference !== 0) {
          await LeaveBalance.updateMany(
            { year: year },
            { $inc: { remaining: dayDifference, used: -dayDifference } }
          );
        }
      }
    }

    // 6. Eksekusi Update ke Database (isRecurring resmi dihapus)
    await Holiday.findByIdAndUpdate(id, {
      name,
      date: parsedStartDate,
      endDate: endDate ? parsedEndDate : null,
      type,
      isDeductLeave: finalIsDeductLeave,
      description,
      year,
    });

    return res.redirect("/leave/manage-calendar?tab=calendar");
  } catch (error) {
    console.error("Error Update Holiday:", error);
    return res
      .status(500)
      .render("error", { title: "update holiday error", message: error.message });
  }
};

export const toggleHolidayStatus = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ success: false, message: "Akses ditolak." });
    }

    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ success: false, message: "Data tidak ditemukan." });
    }

    // 1. Hitung total hari dari agenda ini
    const start = new Date(holiday.date);
    const end = holiday.endDate ? new Date(holiday.endDate) : new Date(holiday.date);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Tentukan status target setelah di-toggle
    const targetStatus = !holiday.isActive;

    // ======================================================================
    // 2. LOGIC INTEGRASI SALDO MASSAL SAAT ARSIP / RESTORE
    // ======================================================================
    // Proses refund atau pemotongan hanya dilakukan jika agenda ini bernilai memotong cuti (isDeductLeave: true)
    if (holiday.isDeductLeave === true) {
      if (holiday.isActive === true && targetStatus === false) {
        // Skenario A: Agenda aktif diarsipkan -> Balikin (Refund) saldo ke karyawan massal
        console.log(
          `♻️ Mengarsipkan agenda [${holiday.name}]. Me-refund ${totalDays} hari ke karyawan...`
        );
        await LeaveBalance.updateMany(
          { year: holiday.year },
          { $inc: { remaining: totalDays, used: -totalDays } }
        );
      } else if (holiday.isActive === false && targetStatus === true) {
        // Skenario B: Agenda arsip diaktifkan kembali -> Potong kembali jatah saldo karyawan massal
        console.log(
          `⚠️ Mengaktifkan kembali [${holiday.name}]. Memotong kembali ${totalDays} hari dari karyawan...`
        );
        await LeaveBalance.updateMany(
          { year: holiday.year },
          { $inc: { remaining: -totalDays, used: totalDays } }
        );
      }
    }

    // 3. Simpan perubahan status aktif agenda ke database
    holiday.isActive = targetStatus;
    await holiday.save();

    return res.status(200).json({
      success: true,
      message: `Hari libur berhasil ${holiday.isActive ? "diaktifkan kembali" : "dinonaktifkan (diarsipkan)"}.`,
    });
  } catch (error) {
    console.error("Error Toggle Holiday Status:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// Menghapus data hari libur
export const deleteHoliday = async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Hari libur berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateOrResetLeaveBalance = async (req, res) => {
  try {
    // Tahun diambil dari query / form terselect, default ke tahun berjalan jika kosong
    const selectedYear = req.body.year ? parseInt(req.body.year) : new Date().getFullYear();
    const DEFAULT_LEAVE_QUOTA = 12; // Standar jatah cuti tahunan perusahaan

    console.log(
      `♻️ Memulai proses Generate/Reset Saldo Cuti untuk seluruh karyawan di tahun ${selectedYear}...`
    );

    // 1. Ambil semua karyawan aktif yang berhak mendapatkan jatah cuti
    const activeEmployees = await User.find({ isActive: true });

    if (activeEmployees.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Tidak ada karyawan aktif ditemukan." });
    }

    // 2. HITUNG BEBAN CUTI BERSAMA: Cari semua agenda internal (COMPANY) aktif di tahun tersebut
    const companyHolidays = await Holiday.find({
      year: selectedYear,
      type: "COMPANY",
      isActive: true,
    });

    let totalDeductedDays = 0;
    companyHolidays.forEach((h) => {
      const start = new Date(h.date);
      start.setHours(0, 0, 0, 0);
      const end = h.endDate ? new Date(h.endDate) : new Date(h.date);
      end.setHours(0, 0, 0, 0);

      const diffTime = Math.abs(end - start);
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      totalDeductedDays += days;
    });

    console.log(
      `📊 Ditemukan total ${totalDeductedDays} hari cuti bersama terdaftar di tahun ${selectedYear}.`
    );

    // 3. PROSES MASSAL: Looping eksekusi menggunakan Promise.all agar performa cepat dan non-blocking
    await Promise.all(
      activeEmployees.map(async (employee) => {
        // Kalkulasi jatah akhir setelah dikurangi akumulasi cuti bersama yang sudah lewat/terdaftar
        const initialRemaining = DEFAULT_LEAVE_QUOTA - totalDeductedDays;
        const initialUsed = totalDeductedDays;

        // Upsert Logic: Jika sudah ada maka di-overwrite (Reset), jika belum ada maka di-insert (Generate)
        await LeaveBalance.findOneAndUpdate(
          {
            userId: employee._id,
            year: selectedYear,
          },
          {
            $set: {
              userId: employee._id,
              year: selectedYear,
              allocated: DEFAULT_LEAVE_QUOTA,
              remaining: initialRemaining >= 0 ? initialRemaining : 0,
              used: initialUsed,
              updatedAt: new Date(),
            },
          },
          {
            upsert: true,
            new: true,
          }
        );
      })
    );

    console.log(`✅ Sukses generate/reset saldo cuti untuk ${activeEmployees.length} karyawan.`);

    // Kembalikan ke halaman manajemen dengan indikator sukses via query string
    return res.redirect(`/leave/manage-requests?tab=balances&status=success&year=${selectedYear}`);
  } catch (error) {
    console.error("Error Generate/Reset Leave Balance:", error);
    return res.status(500).render("error", {
      title: "Reset Saldo - Error",
      message: error.message,
    });
  }
};
async function getNextApprover(requesterRoleName, currentStep) {
  // Pastikan requesterRoleName berupa string nama rolenya (ex: "STAFF")
  const steps = WORKFLOW[requesterRoleName] || [];

  if (!currentStep || currentStep === "HANDOVER") {
    if (steps.length > 0) {
      const nextStep = steps[0]; // Contoh: "MANAGER"

      // 1. Cari dulu dokumen Role-nya berdasarkan nama string-nya
      const roleDoc = await Role.findOne({ name: nextStep });
      if (!roleDoc) return { nextStep: null, nextApproverId: null };

      // 2. FIX: Ubah 'role' menjadi 'roleId' sesuai skema model User kamu
      const approver = await User.findOne({ roleId: roleDoc._id });

      console.log(
        `DEBUG WORKFLOW - Langkah Berikutnya: ${nextStep}, ID Approver:`,
        approver ? approver._id : "TIDAK KETEMU"
      );

      return { nextStep, nextApproverId: approver ? approver._id : null };
    }
    return { nextStep: null, nextApproverId: null };
  }

  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex !== -1 && currentIndex < steps.length - 1) {
    const nextStep = steps[currentIndex + 1];

    // Lakukan hal yang sama untuk pencarian step berikutnya
    const roleDoc = await Role.findOne({ name: nextStep });
    if (!roleDoc) return { nextStep: null, nextApproverId: null };

    // 2. FIX JUGA DI SINI: Ubah 'role' menjadi 'roleId'
    const approver = await User.findOne({ roleId: roleDoc._id });
    return { nextStep, nextApproverId: approver ? approver._id : null };
  }

  return { nextStep: null, nextApproverId: null };
}

export const showApplyLeave = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentYear = new Date().getFullYear();

    const [leaveTypes, employees, leaveBalance] = await Promise.all([
      LeaveType.find({ isActive: true }),
      User.find({ _id: { $ne: userId } }).populate("employeeData", "fullName"),
      LeaveBalance.findOne({ userId, year: currentYear }),
    ]);

    res.render("leave/create", {
      title: "Pengajuan Cuti",
      leaveTypes,
      employees,
      leaveBalance: leaveBalance || { totalQuota: 12, used: 0, remaining: 12 },
      mode: "CREATE",
      leave: null,
    });
  } catch (error) {
    res.status(500).render("error", { title: "show apply leave error", message: error.message });
  }
};
export const applyLeave = async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, reason, handoverUserId } = req.body;
    const requester = req.session.user;
    const documentPath = req.file ? `/uploads/files/${req.file.filename}` : null;

    // 1. HITUNG ULANG totalDays di sisi Server (Anti Double-Deduct)
    const finalTotalDays = await calculateWorkDays(startDate, endDate);

    // Validasi: Jika tanggal yang dipilih semuanya berisi hari libur/cuti bersama
    if (finalTotalDays === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Pengajuan ditolak. Semua tanggal yang Anda pilih adalah hari libur atau cuti bersama.",
      });
    }

    // 2. Validasi: Pastikan saldo cukup sebelum create apapun
    const currentYear = new Date(startDate).getFullYear();
    const balance = await LeaveBalance.findOne({ userId: requester._id, year: currentYear });

    if (!balance || balance.remaining < finalTotalDays) {
      return res.status(400).json({
        success: false,
        message: "Saldo cuti tidak mencukupi untuk durasi tersebut.",
      });
    }

    // 3. Create Leave dengan totalDays hasil kalkulasi bersih server
    const newLeave = await Leave.create({
      userId: requester._id,
      leaveTypeId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalDays: finalTotalDays,
      reason,
      documentPath,
      handoverUserId: handoverUserId || null,
      status: "PENDING",
    });

    // ... (Logika workflow approval kamu)
    let currentStep = "";
    let approverId = null;

    if (handoverUserId) {
      currentStep = "HANDOVER";
      approverId = handoverUserId;
    } else {
      const { nextStep, nextApproverId } = await getNextApprover(requester.role, null);
      currentStep = nextStep;
      approverId = nextApproverId;
    }

    if (approverId) {
      await LeaveApproval.create({
        leaveId: newLeave._id,
        step: currentStep,
        approverId,
        status: "PENDING",
      });
    } else {
      newLeave.status = "APPROVED";
      await newLeave.save();

      // Potong saldo jika pengajuan langsung AUTO-APPROVED (tidak ada approver)
      balance.used += Number(finalTotalDays);
      balance.remaining -= Number(finalTotalDays);
      await balance.save();
    }

    return res.redirect("/leave/my-history");
  } catch (error) {
    console.error("Error pada applyLeave:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const myLeave = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentYear = new Date().getFullYear();

    const [leaves, balanceResult, holidays] = await Promise.all([
      Leave.find({ userId })
        .populate("leaveTypeId", "name code")
        .populate({
          path: "handoverUserId",
          populate: { path: "employeeData", select: "fullName" },
        })
        .sort({ createdAt: -1 }),

      LeaveBalance.findOne({ userId, year: currentYear }),

      Holiday.find({
        date: {
          $gte: new Date(`${currentYear}-01-01`),
          $lte: new Date(`${currentYear}-12-31`),
        },
      }),
    ]);

    const balance = balanceResult || { totalQuota: 12, used: 0, remaining: 12 };
    const totalCompanyHolidays = holidays.filter((h) => h.isDeductLeave).length;
    const pendingApprovalCount = await Leave.countDocuments({ userId, status: "PENDING" });

    const usedPrivateCuti = leaves
      .filter((l) => l.status === "APPROVED")
      .reduce((acc, curr) => acc + curr.totalDays, 0);

    res.render("leave/my-history", {
      title: "Riwayat Cuti",
      leaves,
      summary: {
        totalQuota: balance.totalQuota,
        companyHolidays: totalCompanyHolidays,
        usedPrivate: usedPrivateCuti,
        pending: pendingApprovalCount,
        remaining: balance.remaining,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getLeaveDetail = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate("leaveTypeId", "name")
      .populate({
        path: "userId",
        populate: [
          {
            path: "employeeData",
            select: "fullName unitId",
            populate: {
              path: "unitId",
              select: "name",
            },
          },
          {
            path: "leaveBalanceData",
          },
        ],
      })
      .populate({
        path: "handoverUserId",
        populate: {
          path: "employeeData",
          select: "fullName",
        },
      });
    const workflows = await LeaveApproval.find({ leaveId: req.params.id })
      .populate({
        path: "approverId",
        populate: {
          path: "employeeData",
          model: "Employee",
          select: "fullName",
        },
      })
      .sort({ createdAt: 1 });

    res.render("leave/detail", {
      title: "Detail Pengajuan Cuti",
      leave,
      approvals: workflows,
      user: req.user,
    });
  } catch (error) {
    res.status(500).render("error", { title: "get leave detail err", message: error.message });
  }
};

export const editLeave = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentYear = new Date().getFullYear();

    // Tambahkan .populate() pada Leave.findById agar relasi tipe cutinya terbawa
    const [leave, leaveTypes, employees, leaveBalance] = await Promise.all([
      Leave.findById(req.params.id).populate("leaveTypeId"), // <-- Ubah bagian ini
      LeaveType.find({ isActive: true }),
      User.find({ _id: { $ne: userId } }).populate("employeeData", "fullName"),
      LeaveBalance.findOne({ userId, year: currentYear }),
    ]);

    if (!leave || leave.status !== "PENDING") {
      return res
        .status(400)
        .render("error", { title: "edit leave", message: "Cuti tidak bisa diubah." });
    }

    res.render("leave/create", {
      title: "Edit Cuti",
      leaveTypes,
      employees,
      leaveBalance: leaveBalance || { totalQuota: 12, used: 0, remaining: 12 },
      mode: "EDIT",
      leave,
      error: null,
    });
  } catch (error) {
    res.status(500).render("error", { title: "edit leave", message: error.message });
  }
};
export const updateLeave = async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, totalDays, reason, handoverUserId } = req.body;
    const requester = req.user;

    const leave = await Leave.findById(req.params.id);
    if (!leave || leave.status !== "PENDING") {
      return res
        .status(400)
        .render("error", { title: "update leave", message: "Gagal update data." });
    }

    leave.leaveTypeId = leaveTypeId;
    leave.startDate = startDate;
    leave.endDate = endDate;
    leave.totalDays = totalDays;
    leave.reason = reason;
    leave.handoverUserId = handoverUserId || null;
    await leave.save();

    // Hapus alur approval lama untuk dibuild ulang
    await LeaveApproval.deleteMany({ leaveId: leave._id });

    let currentStep = "";
    let approverId = null;

    if (handoverUserId) {
      currentStep = "HANDOVER";
      approverId = handoverUserId;
    } else {
      const { nextStep, nextApproverId } = await getNextApprover(requester.role, null);
      currentStep = nextStep;
      approverId = nextApproverId;
    }

    if (approverId) {
      await LeaveApproval.create({
        leaveId: leave._id,
        step: currentStep,
        approverId,
        status: "PENDING",
      });
    }

    res.redirect("/leave/my-history");
  } catch (error) {
    // PERBAIKAN UTAMA: Tambahkan title agar layout main.ejs tidak crash saat error database/input
    return res.status(500).render("error", {
      title: "Tambah Agenda - Error",
      message: error.message,
    });
  }
};

export const cancelPendingLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave || leave.status !== "PENDING") {
      return res.status(400).render("error", {
        title: "cancel pending error",
        message: "Pembatalan gagal. Pengajuan tidak ditemukan atau sudah diproses.",
      });
    }

    leave.status = "CANCELLED";
    await leave.save();

    await LeaveApproval.updateMany(
      { leaveId: leave._id, status: "PENDING" },
      {
        status: "CANCELLED",
        note: "Dibatalkan oleh pemohon",
        actionDate: new Date(),
      }
    );

    res.redirect("/leave/my-history");
  } catch (error) {
    // FIX: Tambahkan title juga di sini
    return res.status(500).render("error", {
      title: "Error Sistem", // <-- WAJIB ADA
      message: error.message,
    });
  }
};
export const requestCancelApprovedLeave = async (req, res) => {
  try {
    const { reason } = req.body;
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res.redirect("/?error=SESSION_EXPIRED");
    }

    // 1. Cari data cuti utama yang statusnya APPROVED milik user yang sedang login
    const leave = await Leave.findOne({
      _id: req.params.id,
      userId: sessionUser._id,
      status: "APPROVED",
    });

    if (!leave) {
      return res.status(404).render("error", {
        title: "Error Pembatalan",
        message: "Data cuti tidak ditemukan atau tidak valid untuk dibatalkan.",
      });
    }

    // 2. Ubah status induk cuti menjadi CANCELLATION_PENDING
    leave.status = "CANCELLATION_PENDING";
    await leave.save();

    // 3. Simpan data detail pembatalan ke tabel LeaveCancellation untuk log audit
    await LeaveCancellation.create({
      leaveId: leave._id,
      requestedBy: sessionUser._id,
      cancelReason: reason || "Mengajukan pembatalan cuti.",
      status: "PENDING",
    });

    // 4. PEMBENTUKAN WORKFLOW PEMBATALAN SESUAI KEBUTUHAN KAMU
    let targetStep = "HR"; // Default target untuk MANAGER dan GENERAL_MANAGER

    // Ambil string role dan normalkan (contoh: "STAFF", "KEUANGAN", "HR")
    const userRole = (sessionUser.role || "").toString().trim().toUpperCase();

    if (userRole === "STAFF" || userRole === "KEUANGAN") {
      targetStep = "MANAGER"; // Staff & Keuangan wajib disetujui Manager dulu
    } else if (userRole === "HR") {
      targetStep = "PIMPINAN"; // Jika HR yang cuti, lempar langsung ke Pimpinan
    }

    // 5. Cari dokumen Role berdasarkan nama targetStep
    const roleDoc = await Role.findOne({ name: targetStep });
    if (!roleDoc) {
      return res.status(500).render("error", {
        title: "Error Sistem Workflow",
        message: `Struktur Role tingkat ${targetStep} tidak ditemukan di database.`,
      });
    }

    // 6. Cari user yang menjabat role tersebut untuk ditugaskan sebagai approver
    const targetApprover = await User.findOne({ roleId: roleDoc._id });
    if (!targetApprover) {
      return res.status(404).render("error", {
        title: "Approver Tidak Ditemukan",
        message: `Akun penanggung jawab untuk posisi ${targetStep} belum terdaftar di sistem.`,
      });
    }

    // 7. Masukkan berkas pembatalan ke antrean LeaveApproval target
    await LeaveApproval.create({
      leaveId: leave._id,
      step: targetStep,
      approverId: targetApprover._id,
      status: "PENDING",
      note: reason || "Mengajukan pembatalan cuti.",
    });

    // 8. Redirect kembali ke riwayat cuti saya
    return res.redirect("/leave/my-history");
  } catch (error) {
    console.error("Error pada requestCancelApprovedLeave:", error);
    return res.status(500).render("error", { title: "Error Sistem", message: error.message });
  }
};
export const showResubmitLeave = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentYear = new Date().getFullYear();

    const [leave, leaveTypes, employees, leaveBalance] = await Promise.all([
      Leave.findById(req.params.id),
      LeaveType.find({ isActive: true }),
      User.find({ _id: { $ne: userId } }).populate("employeeData", "fullName"),
      LeaveBalance.findOne({ userId, year: currentYear }),
    ]);

    if (!leave || leave.status !== "REJECTED") {
      return res.status(400).render("error", {
        title: "show resubmit error",
        message: "Cuti tidak berstatus ditolak.",
      });
    }

    res.render("leave/create", {
      title: "Ajukan Ulang Cuti",
      leaveTypes,
      employees,
      leaveBalance: leaveBalance || { totalQuota: 12, used: 0, remaining: 12 },
      mode: "RESUBMIT",
      leave,
    });
  } catch (error) {
    // PERBAIKAN UTAMA: Tambahkan title di block catch error
    return res.status(500).render("error", {
      title: "Ajukan Ulang - Error",
      message: error.message,
    });
  }
};
export const myDelegations = async (req, res) => {
  try {
    const baseQuery = {
      approverId: req.user._id,
      step: "HANDOVER",
    };

    const [active, history] = await Promise.all([
      LeaveApproval.find({
        ...baseQuery,
        status: "PENDING",
      }).populate({
        path: "leaveId",
        populate: [
          {
            path: "userId",
            model: "User",
            select: "username employeeData",
            populate: {
              path: "employeeData",
              model: "Employee",
              select: "fullName",
            },
          },
          {
            path: "leaveTypeId",
            model: "LeaveType",
            select: "name",
          },
        ],
      }),

      LeaveApproval.find({
        ...baseQuery,
        status: { $in: ["APPROVED", "REJECTED"] },
      }).populate({
        path: "leaveId",
        populate: [
          {
            path: "userId",
            model: "User",
            select: "username employeeData",
            populate: {
              path: "employeeData",
              model: "Employee",
              select: "fullName",
            },
          },
          {
            path: "leaveTypeId",
            model: "LeaveType",
            select: "name",
          },
        ],
      }),
    ]);

    const delegations = active.filter((d) => d.leaveId);
    const historyDelegations = history.filter((d) => d.leaveId);
    console.log(JSON.stringify(delegations[0], null, 2));
    return res.render("leave/delegation", {
      title: "Delegasi Tugas Saya",
      delegations,
      historyDelegations,
    });
  } catch (error) {
    return res.status(500).render("error", {
      title: "Delegasi Error",
      message: error.message,
    });
  }
};
export const approveDelegation = async (req, res) => {
  try {
    const { note } = req.body;
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res
        .status(401)
        .render("error", { title: "Error", message: "Sesi Anda telah berakhir." });
    }

    // 1. Cari data antrean handover yang sedang PENDING
    const approval = await LeaveApproval.findOne({
      _id: req.params.id,
      approverId: sessionUser._id,
      step: "HANDOVER",
      status: "PENDING",
    });

    if (!approval) {
      return res.status(404).render("error", { title: "Error", message: "Data tidak ditemukan." });
    }

    // 2. Setujui tahap Handover
    approval.status = "APPROVED";
    approval.actionDate = new Date();
    approval.note = note || "";
    await approval.save();

    // 3. Ambil data cuti dan populate field 'roleId' milik pemohon
    const leave = await Leave.findById(approval.leaveId).populate({
      path: "userId",
      populate: { path: "roleId" },
    });

    const requester = leave.userId;

    // PERBAIKAN UTAMA: Gunakan 'roleId' bukan 'role' karena field skema kamu adalah roleId
    const requesterRoleName =
      requester.roleId && requester.roleId.name
        ? requester.roleId.name.toString().trim().toUpperCase()
        : "";

    console.log("DEBUG - BERHASIL MENDAPATKAN ROLE STRUKTURAL:", requesterRoleName);

    // 4. Cari tahapan atasan pertama (misal: MANAGER) setelah HANDOVER sukses
    const { nextStep, nextApproverId } = await getNextApprover(requesterRoleName, "HANDOVER");

    if (nextApproverId) {
      // Jika ditemukan (misal akun Manager ada di database), buat antrean baru
      await LeaveApproval.create({
        leaveId: leave._id,
        step: nextStep,
        approverId: nextApproverId,
        status: "PENDING",
      });
    } else {
      // Jalur pengaman jika memang role tersebut adalah kasta tertinggi (tanpa atasan lagi)
      leave.status = "APPROVED";
      await leave.save();

      const currentYear = new Date(leave.startDate).getFullYear();
      // Menggunakan requester._id karena leave.userId sudah berbentuk objek terpopulasi
      const balance = await LeaveBalance.findOne({ userId: requester._id, year: currentYear });
      if (balance) {
        balance.used += leave.totalDays;
        balance.remaining -= leave.totalDays;
        await balance.save();
      }
    }

    res.redirect("/leave/my-delegations");
  } catch (error) {
    res.status(500).render("error", { title: "Error", message: error.message });
  }
};
export const rejectDelegation = async (req, res) => {
  try {
    const { note } = req.body;
    const approval = await LeaveApproval.findOne({
      _id: req.params.id,
      approverId: req.user._id,
      step: "HANDOVER",
      status: "PENDING",
    });
    if (!approval)
      return res
        .status(404)
        .render("error", { title: "reject delegation", message: "Data tidak ditemukan." });

    approval.status = "REJECTED";
    approval.note = note || "";
    approval.actionDate = new Date();
    await approval.save();

    await Leave.findByIdAndUpdate(approval.leaveId, { status: "REJECTED" });

    res.redirect("/leave/my-delegations");
  } catch (error) {
    res.status(500).render("error", { title: "reject delegation error", message: error.message });
  }
};

export const showApprovals = async (req, res) => {
  try {
    const approvals = await LeaveApproval.find({
      approverId: req.user._id,
      step: { $in: ["MANAGER", "HR", "PIMPINAN"] },
      status: "PENDING",
    }).populate({
      path: "leaveId",
      populate: [
        { path: "userId", populate: { path: "employeeData", select: "fullName" } },
        { path: "leaveTypeId", select: "name" },
      ],
    });

    res.render("leave/approvals", { title: "Persetujuan Cuti Karyawan", approvals });
  } catch (error) {
    res.status(500).render("error", { title: "show approval error", message: error.message });
  }
};

export const approveLeave = async (req, res) => {
  try {
    const { note } = req.body;

    // 1. Ambil data user login dari session
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res.status(401).render("error", {
        title: "Error",
        message: "Sesi Anda telah berakhir. Silakan login kembali.",
      });
    }

    // 2. Cari data antrean persetujuan yang sedang PENDING
    const approval = await LeaveApproval.findOne({
      _id: req.params.id,
      approverId: sessionUser._id,
      status: "PENDING",
    });

    if (!approval) {
      return res.status(404).render("error", {
        title: "approve leave",
        message: "Data persetujuan tidak ditemukan atau sudah diproses.",
      });
    }

    // 3. Update status antrean saat ini menjadi APPROVED
    approval.status = "APPROVED";
    approval.note = note || "";
    approval.actionDate = new Date();
    await approval.save();

    // 4. FIX POPULATE: Deep populate sampai ke roleId milik pemohon
    const leave = await Leave.findById(approval.leaveId).populate({
      path: "userId",
      populate: { path: "roleId" },
    });

    const requester = leave.userId;

    // 5. Ambil string nama role dari roleId pemohon
    const requesterRoleName =
      requester.roleId && requester.roleId.name
        ? requester.roleId.name.toString().trim().toUpperCase()
        : "";

    console.log(
      `DEBUG APPROVE LEAVE - Pemohon: ${requester.username} (${requesterRoleName}), Step Saat Ini: ${approval.step}`
    );

    // ====================================================================
    // INTERSEPSI LOGIKA KHUSUS: MENANGANI PEMBATALAN (CANCELLATION_PENDING)
    // ====================================================================
    if (leave.status === "CANCELLATION_PENDING") {
      // JIKA YANG BARU APPROVE ADALAH MANAGER (Artinya cancel milik Staff/Keuangan lolos tahap 1)
      if (approval.step === "MANAGER") {
        // Cari dokumen Role HR di database
        const hrRoleDoc = await Role.findOne({ name: "HR" });
        if (!hrRoleDoc) throw new Error("Struktur Role HR tidak ditemukan di database.");

        // Cari user dengan jabatan HR untuk dijadikan target berikutnya
        const hrUser = await User.findOne({ roleId: hrRoleDoc._id });
        if (!hrUser) throw new Error("Akun penanggung jawab HR belum terdaftar di sistem.");

        // Lempar antrean baru ke meja HR (Estafet Tahap 2)
        await LeaveApproval.create({
          leaveId: leave._id,
          step: "HR",
          approverId: hrUser._id,
          status: "PENDING",
          note: "Persetujuan pembatalan disetujui oleh Manager, menunggu verifikasi akhir HR.",
        });

        console.log(
          `DEBUG CANCEL WORKFLOW - Berhasil melempar pembatalan ${requesterRoleName} dari MANAGER ke HR.`
        );
      }
      // JIKA YANG APPROVE ADALAH TAHAP AKHIR (HR untuk staff/keuangan/mgr/gm, atau PIMPINAN untuk kasus user HR)
      else if (approval.step === "HR" || approval.step === "PIMPINAN") {
        // 1. Ubah status induk dokumen cuti final menjadi CANCELLED
        leave.status = "CANCELLED";
        await leave.save();

        // 2. Sinkronkan status di tabel audit log (LeaveCancellation) menjadi APPROVED
        await LeaveCancellation.findOneAndUpdate(
          { leaveId: leave._id, status: "PENDING" },
          { status: "APPROVED" }
        );

        // 3. PROSES ROLLBACK / PENGEMBALIAN SALDO CUTI
        const currentYear = new Date(leave.startDate).getFullYear();
        const balance = await LeaveBalance.findOne({ userId: requester._id, year: currentYear });

        if (balance) {
          balance.used -= Number(leave.totalDays); // Kurangi angka terpakai
          balance.remaining += Number(leave.totalDays); // Kembalikan sisa kuota cuti
          await balance.save();
        }

        console.log(
          `DEBUG CANCEL WORKFLOW - Pembatalan FINAL APPROVED. Saldo milik ${requester.username} dikembalikan.`
        );
      }

      // Selesai memproses seluruh alur pembatalan, langsung redirect dan potong komando di sini
      return res.redirect("/leave/manage-requests");
    }
    // ====================================================================

    // 6. CARI TAHAPAN BERIKUTNYA DI OBJEK WORKFLOW (UNTUK PENGAJUAN CUTI BARU)
    const { nextStep, nextApproverId } = await getNextApprover(requesterRoleName, approval.step);

    if (nextApproverId) {
      // Jika ditemukan approver untuk step berikutnya, buat antrean baru
      await LeaveApproval.create({
        leaveId: leave._id,
        step: nextStep,
        approverId: nextApproverId,
        status: "PENDING",
      });

      console.log(`DEBUG WORKFLOW - Berhasil melempar persetujuan ke tahap: ${nextStep}`);
    } else {
      // Jika sudah mencapai ujung alur WORKFLOW pengajuan biasa
      leave.status = "APPROVED";
      await leave.save();

      // Potong kuota cuti tahunan milik user pemohon
      const currentYear = new Date(leave.startDate).getFullYear();
      const balance = await LeaveBalance.findOne({ userId: requester._id, year: currentYear });
      if (balance) {
        balance.used += leave.totalDays;
        balance.remaining -= leave.totalDays;
        await balance.save();
      }

      console.log(`DEBUG WORKFLOW - Alur selesai. Cuti otomatis FINAL APPROVED.`);
    }

    return res.redirect("/leave/manage-requests");
  } catch (error) {
    console.error("Error pada approveLeave:", error);
    return res.status(500).render("error", { title: "approve leave", message: error.message });
  }
};
export const rejectLeave = async (req, res) => {
  try {
    const { note } = req.body;

    // 1. Ambil data user login dari session (bukan req.user)
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res.status(401).render("error", {
        title: "Error",
        message: "Sesi Anda telah berakhir. Silakan login kembali.",
      });
    }

    // 2. Cari data antrean persetujuan yang ditujukan ke user login saat ini
    const approval = await LeaveApproval.findOne({
      _id: req.params.id,
      approverId: sessionUser._id, // FIX: Pakai sessionUser
      status: "PENDING",
    });

    if (!approval) {
      return res.status(404).render("error", {
        title: "Reject Leave",
        message: "Data persetujuan tidak ditemukan atau sudah diproses.",
      });
    }

    // 3. Ubah status step approval saat ini menjadi REJECTED
    approval.status = "REJECTED";
    approval.note = note || "";
    approval.actionDate = new Date();
    await approval.save();

    // 4. Gagalkan status utama pengajuan (induk) langsung di tabel Leave
    await Leave.findByIdAndUpdate(approval.leaveId, { status: "REJECTED" });

    console.log(
      `DEBUG REJECT LEAVE - Pengajuan Cuti ID: ${approval.leaveId} berhasil DITOLAK oleh ${sessionUser.username} pada tahap ${approval.step}`
    );

    // 5. FIX REDIRECT: Alihkan ke halaman kelola request yang baru
    return res.redirect("/leave/manage-requests");
  } catch (error) {
    res.status(500).render("error", { title: "Error", message: error.message });
  }
};
export const getManageLeavePage = async (req, res) => {
  try {
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res.redirect("/?error=UNAUTHORIZED");
    }

    const normalizedRole = (sessionUser.role || "").toString().trim().toUpperCase();
    sessionUser.role = normalizedRole;

    const APPROVER_ROLES = ["MANAGER", "HR", "PIMPINAN", "GENERAL_MANAGER"];

    if (!APPROVER_ROLES.includes(normalizedRole)) {
      return res.redirect("/?error=FORBIDDEN");
    }

    // 1. Ambil SEMUA data approval milik user ini berdasarkan approverId atau role-nya (selain HANDOVER)
    const myStructuralApprovals = await LeaveApproval.find({
      $or: [
        { approverId: sessionUser._id },
        { step: normalizedRole }, // Jaga-jaga jika approverId belum di-set di awal, kita filter via step/role
      ],
      step: { $ne: "HANDOVER" },
    });

    const activeLeaveIds = [];
    const historyLeaveIds = [];

    // 2. Lakukan validasi antrean berantai secara ketat
    for (const app of myStructuralApprovals) {
      if (app.status === "PENDING") {
        // --- GERBANG 1: JIKA SAYA MANAGER, CEK HANDOVER ---
        if (app.step === "MANAGER") {
          const handoverCheck = await LeaveApproval.findOne({
            leaveId: app.leaveId,
            step: "HANDOVER",
          });

          // hanya blok kalau handover ADA tapi belum approve
          if (handoverCheck && handoverCheck.status !== "APPROVED") {
            continue;
          }
        }

        // --- GERBANG 2: JIKA SAYA HR, CEK MANAGER ---
        if (app.step === "HR") {
          const managerCheck = await LeaveApproval.findOne({
            leaveId: app.leaveId,
            step: "MANAGER",
          });
          // Jika manager belum approve (atau reject), HR belum boleh lihat
          if (managerCheck && managerCheck.status !== "APPROVED") {
            continue;
          }
        }

        // --- GERBANG 3: JIKA SAYA PIMPINAN / GM, CEK HR ---
        if (app.step === "PIMPINAN" || app.step === "GENERAL_MANAGER") {
          const hrCheck = await LeaveApproval.findOne({
            leaveId: app.leaveId,
            step: "HR",
          });
          // Jika HR belum approve, Pimpinan/GM belum boleh lihat
          if (hrCheck && hrCheck.status !== "APPROVED") {
            continue;
          }
        }

        // Jika lolos semua sensor antrean di atas, baru masuk ke tab Aktif
        activeLeaveIds.push(app.leaveId);
      } else {
        // Jika statusnya sudah APPROVED/REJECTED oleh user ini, langsung masuk ke riwayat
        historyLeaveIds.push(app.leaveId);
      }
    }

    // 3. Ambil data Leave untuk Tab Aktif (Hanya yang lolos sensor antrean)
    const activeLeaves = await Leave.find({
      _id: { $in: activeLeaveIds },
      status: { $in: ["PENDING", "CANCELLATION_PENDING"] }, // Memastikan cutinya sendiri memang belum konklusi/selesai
    })
      .populate("leaveTypeId", "name")
      .populate({
        path: "userId",
        populate: { path: "employeeData", select: "fullName" },
      })
      .sort({ createdAt: -1 });

    // 4. Ambil data Leave untuk Tab Riwayat
    const historyLeaves = await Leave.find({
      _id: { $in: historyLeaveIds },
    })
      .populate("leaveTypeId", "name")
      .populate({
        path: "userId",
        populate: { path: "employeeData", select: "fullName" },
      })
      .sort({ createdAt: -1 });

    // Kalender
    const currentYear = new Date().getFullYear();
    const selectedYear = req.query.year ? parseInt(req.query.year) : currentYear;

    const holidays = await Holiday.find({
      $or: [{ year: selectedYear }, { isRecurring: true }],
    }).sort({ date: 1 });

    return res.render("leave/manage-center", {
      title: "Pusat Manajemen Cuti",
      user: sessionUser,
      activeLeaves,
      historyLeaves,
      holidays,
      selectedYear,
    });
  } catch (error) {
    return res.status(500).render("error", {
      title: "Pusat Manajemen Cuti - Error",
      message: error.message,
    });
  }
};
