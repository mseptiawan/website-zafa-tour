import Loan from "../models/loan/Loan.model.js";
import Employee from "../models/employee/Employee.model.js";
import LoanApproval from "../models/loan/LoanApproval.model.js";
import LoanPayment from "../models/loan/loanPayment.model.js";
import User from "../models/basic/User.model.js";
import Role from "../models/basic/Role.model.js";
import { getPayrollPeriod } from "../utils/payrollPeriod.js";
import notificationService from "./notification.service.js";
import { MODULES, NOTIF_CATEGORIES } from "../config/constants.js";

/**
 * Alur kerja persetujuan pinjaman perusahaan berdasarkan urutan hierarki peran.
 * @type {string[]}
 
const LOAN_WORKFLOW = ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA", "MANAGER_KEUANGAN"];

export async function getTotalMonthlyDeduction(employeeId) {
  const activeLoans = await Loan.find({
    employeeId,
    status: { $in: ["PENDING", "APPROVED"] },
  });

  return activeLoans.reduce((sum, loan) => {
    return sum + (loan.monthlyDeduction || 0);
  }, 0);
}

/**
 * Menentukan tahapan approval berikutnya berdasarkan alur kerja perusahaan.
 * * @param {string|null} currentStep - Tahapan persetujuan saat ini (misal: "WAKIL_DIREKTUR"). Jika null, akan memulai dari awal alur kerja.
 * @returns {Promise<{nextStep: string|null, nextApproverId: string|null}>} Objek berisi tahapan berikutnya dan ID pengguna yang berwenang menyetujui.
 */
export const getNextLoanApproverService = async (currentStep) => {
  if (!currentStep) {
    const roleDoc = await Role.findOne({ name: "WAKIL_DIREKTUR" });
    if (!roleDoc) return { nextStep: "WAKIL_DIREKTUR", nextApproverId: null };
    const approver = await User.findOne({ roleId: roleDoc._id });
    return { nextStep: "WAKIL_DIREKTUR", nextApproverId: approver ? approver._id : null };
  }

  const currentIndex = LOAN_WORKFLOW.indexOf(currentStep);
  if (currentIndex !== -1 && currentIndex < LOAN_WORKFLOW.length - 1) {
    const nextStep = LOAN_WORKFLOW[currentIndex + 1];
    const roleDoc = await Role.findOne({ name: nextStep });
    if (!roleDoc) return { nextStep, nextApproverId: null };
    const approver = await User.findOne({ roleId: roleDoc._id });
    return { nextStep, nextApproverId: approver ? approver._id : null };
  }

  return { nextStep: null, nextApproverId: null };
};

/**
 * Mengambil profil data pegawai beserta informasi gaji finansial terpadu.
 * * @param {string} userId - ID Pengguna (User ID) dari pegawai terkait.
 * @returns {Promise<Object>} Data profil karyawan objek biasa (lean object).
 * @throws {Error} Jika data karyawan tidak ditemukan di dalam sistem database.
 */
export const getEmployeeForFormService = async (userId) => {
  const employee = await Employee.findOne({ userId }).lean();
  if (!employee) throw new Error("Data Karyawan tidak ditemukan di sistem.");

  employee.basicSalary = employee.financialData?.basicSalary || 0;
  return employee;
};

/**
 * Membuat pengajuan pinjaman baru dengan validasi rasio cicilan 30% gaji sekaligus mengirim notifikasi ke approver.
 * * @param {string} employeeId - ID Dokumen Karyawan yang mengajukan pinjaman.
 * @param {Object} loanData - Objek data pengajuan pinjaman dari formulir.
 * @param {number|string} loanData.amountRequested - Jumlah nominal dana pinjaman yang diajukan.
 * @param {number|string} loanData.tenorMonths - Durasi masa angsuran pinjaman dalam hitungan bulan.
 * @param {string} loanData.reason - Alasan rasional pengajuan pinjaman (minimal 15 karakter).
 * @param {string} [userRole=""] - Nama peran dari pembuat dokumen saat ini.
 * @param {string} [creatorName="Karyawan"] - Nama lengkap pembuat pengajuan untuk keperluan pengiriman notifikasi.
 * @returns {Promise<Object>} Dokumen pinjaman baru yang berhasil disimpan ke database.
 * @throws {Error} Jika parameter tidak valid, melanggar batas nominal, tenor salah, atau melebihi batas 30% gaji pokok.
 */
export const storeLoanService = async (
  employeeId,
  loanData,
  userRole = "",
  creatorName = "Karyawan"
) => {
  if (!employeeId) {
    throw new Error("Profil karyawan tidak valid atau Anda tidak terdaftar sebagai pegawai.");
  }

  const employee = await Employee.findById(employeeId).lean();
  if (!employee) throw new Error("Data Karyawan tidak ditemukan.");

  const basicSalary = employee.financialData?.basicSalary || 0;
  const existingMonthlyCommitment = await getTotalMonthlyDeduction(employeeId);

  const amountRequested = Number(loanData.amountRequested) || 0;
  const tenorMonths = Number(loanData.tenorMonths) || 0;
  const reason = loanData.reason?.trim();

  if (!reason || reason.length < 15) {
    throw new Error("Alasan peminjaman terlalu pendek. Berikan penjelasan minimal 15 karakter.");
  }

  const maxLoan = basicSalary * 3;
  if (amountRequested > maxLoan) {
    throw new Error(
      `Jumlah pinjaman (Rp ${amountRequested.toLocaleString("id-ID")}) melebihi batas maksimal 3x gaji pokok (Maksimal Rp ${maxLoan.toLocaleString("id-ID")}).`
    );
  }

  if (tenorMonths < 1 || tenorMonths > 12) {
    throw new Error("Tenor pinjaman harus berada di antara 1 sampai 12 bulan.");
  }

  const monthlyDeduction = Math.ceil(amountRequested / tenorMonths);
  const maxDeduction = basicSalary * 0.3;
  const totalMonthlyAfterLoan = existingMonthlyCommitment + monthlyDeduction;

  if (totalMonthlyAfterLoan > maxDeduction) {
    throw new Error(
      `Total cicilan Anda (Cicilan aktif Rp ${existingMonthlyCommitment.toLocaleString("id-ID")} + Pengajuan baru Rp ${monthlyDeduction.toLocaleString("id-ID")} = Rp ${totalMonthlyAfterLoan.toLocaleString("id-ID")}) melebihi batas toleransi 30% gaji pokok (Maksimal Rp ${maxDeduction.toLocaleString("id-ID")}).`
    );
  }

  const newLoan = await Loan.create({
    employeeId,
    amountRequested,
    tenorMonths,
    monthlyDeduction,
    reason,
    status: "PENDING",
  });

  const initialStep = userRole === "WAKIL_DIREKTUR" ? "WAKIL_DIREKTUR" : null;
  const { nextStep, nextApproverId } = await getNextLoanApproverService(initialStep);

  await LoanApproval.create({
    loanId: newLoan._id,
    step: nextStep,
    approverId: nextApproverId,
    status: "PENDING",
  });

  // ─── INTEGRASI NOTIFIKASI REALTIME UNTUK APPROVER ─────────────────────────
  if (nextApproverId) {
    try {
      await notificationService.createManyNotifications({
        userIds: [nextApproverId],
        senderId: employee.userId,
        senderName: creatorName,
        title: "Pengajuan Pinjaman Baru",
        text: `${creatorName} mengajukan pinjaman baru sebesar Rp ${amountRequested.toLocaleString("id-ID")}`,
        module: MODULES?.FINANCE || "Finance",
        referenceId: newLoan._id,
        actionUrl: `/loans/approval`,
        type: "EXPENSE",
        category: NOTIF_CATEGORIES?.INFO || "INFO",
      });
    } catch (notifError) {
      console.error("[Notification Error] Gagal mengirim notifikasi pinjaman:", notifError.message);
    }
  }

  return newLoan;
};

/**
 * Mengambil informasi riwayat limit kredit & sisa plafon pinjaman pribadi karyawan.
 * * @param {string} userId - ID Pengguna (User ID) dari pegawai terkait.
 * @returns {Promise<{loans: Object[], summary: {limit: number, maxLoan: number, activeLoan: number, installmentThisMonth: number, remainingDebt: number}}>} Data kumpulan riwayat pinjaman beserta ringkasan kalkulasi sisa plafon utang.
 * @throws {Error} Jika data profil pegawai tidak terdaftar di database.
 */
export const getEmployeeLoanHistoryService = async (userId) => {
  const employee = await Employee.findOne({ userId }).lean();
  if (!employee) throw new Error("Data pegawai tidak ditemukan.");

  const employeeId = employee._id;
  const basicSalary = employee.financialData?.basicSalary || 0;
  const limit = basicSalary * 0.3;

  const loans = await Loan.find({ employeeId }).sort({ createdAt: -1 }).lean();
  const unpaidPayments = await LoanPayment.find({ employeeId, isPaid: false }).lean();

  const activeLoanIds = [...new Set(unpaidPayments.map((p) => p.loanId.toString()))];
  const activeLoansData = await Loan.find({ _id: { $in: activeLoanIds } }).lean();
  const activeLoan = activeLoansData.reduce((sum, loan) => sum + loan.amountRequested, 0);

  const paidPayments = await LoanPayment.find({ employeeId, isPaid: true }).lean();
  const totalPaidAmount = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const rawRemainingDebt = activeLoan - totalPaidAmount;
  const remainingDebt = rawRemainingDebt < 0 ? 0 : rawRemainingDebt;

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthPayment = unpaidPayments.find((p) => p.periodMonth === currentPeriod);
  const installmentThisMonth = currentMonthPayment ? currentMonthPayment.amount : 0;

  return {
    loans,
    summary: {
      limit,
      maxLoan: basicSalary * 3,
      activeLoan,
      installmentThisMonth,
      remainingDebt,
    },
  };
};

/**
 * Mendapatkan detail rincian data pinjaman induk, alur log persetujuan, dan jadwal angsuran pembayaran bulanan.
 * * @param {string} loanId - ID Dokumen induk pinjaman yang ingin dicari.
 * @returns {Promise<{loan: Object, approvals: Object[], payments: Object[]}>} Gabungan objek berisikan detail pinjaman, riwayat verifikasi approval, dan tabel angsuran.
 * @throws {Error} Jika berkas pengajuan pinjaman utama tidak ditemukan.
 */
export const getLoanDetailDataService = async (loanId) => {
  const loan = await Loan.findById(loanId)
    .populate({
      path: "employeeId",
      populate: {
        path: "careerData",
        model: "EmployeeCareer",
        populate: [{ path: "unitId" }, { path: "bidangId" }],
      },
    })
    .lean();

  if (!loan) throw new Error("Data pengajuan pinjaman tidak ditemukan.");

  const approvals = await LoanApproval.find({ loanId })
    .populate({
      path: "approverId",
      populate: { path: "employeeData", model: "Employee", select: "fullName" },
    })
    .sort({ createdAt: 1 })
    .lean();

  const payments = await LoanPayment.find({ loanId }).sort({ installmentNumber: 1 }).lean();

  return { loan, approvals, payments };
};

/**
 * Mengambil data pinjaman khusus untuk kebutuhan halaman penyuntingan (edit form) sebelum diproses manajemen.
 * * @param {string} loanId - ID Dokumen pinjaman yang hendak diubah.
 * @param {string} userId - ID Pengguna (User ID) yang memiliki dokumen pinjaman tersebut.
 * @returns {Promise<{loan: Object, basicSalary: number}>} Objek pinjaman beserta nilai nominal komponen gaji pokok.
 * @throws {Error} Jika pegawai tidak valid, pengajuan tidak ditemukan, status bukan PENDING, atau sudah diverifikasi oleh Manajemen Inti.
 */
export const getLoanForEditService = async (loanId, userId) => {
  const employee = await Employee.findOne({ userId }).lean();
  if (!employee) throw new Error("Data pegawai tidak ditemukan.");

  const loan = await Loan.findOne({ _id: loanId, employeeId: employee._id }).lean();
  if (!loan) throw new Error("Data pengajuan tidak ditemukan.");

  if (loan.status !== "PENDING") {
    throw new Error("Pengajuan yang sudah diproses tidak dapat diubah kembali.");
  }

  const wadirApproval = await LoanApproval.findOne({ loanId, step: "WAKIL_DIREKTUR" }).lean();
  if (wadirApproval && wadirApproval.status !== "PENDING") {
    throw new Error("Pengajuan tidak bisa diubah karena telah diproses Manajemen Inti.");
  }

  const basicSalary = employee.financialData?.basicSalary || 0;
  return { loan, basicSalary };
};

/**
 * Memperbarui (update) data isi dokumen aplikasi pinjaman yang masih berstatus tunda (PENDING).
 * * @param {string} loanId - ID Dokumen pinjaman yang ingin dimodifikasi nilainya.
 * @param {string} userId - ID Pengguna (User ID) dari pegawai pemohon.
 * @param {Object} updateData - Kumpulan payload berisi perubahan data dari form revisi.
 * @param {number|string} updateData.amountRequested - Jumlah perubahan pagu kredit pinjaman baru.
 * @param {number|string} updateData.tenorMonths - Jumlah perubahan tenor angsuran bulanan.
 * @param {string} updateData.reason - Revisi keterangan argumen permohonan pinjaman (minimal 15 karakter).
 * @returns {Promise<Object>} Berkas dokumen pinjaman termutakhir yang telah disimpan.
 * @throws {Error} Jika validasi alasan kependekan, salah masa tenor, melewati plafon 3x lipat gaji pokok, atau melampaui rasio batas aman 30%.
 */
export const updateLoanService = async (loanId, userId, updateData) => {
  const amountRequested = Number(updateData.amountRequested) || 0;
  const tenorMonths = Number(updateData.tenorMonths) || 0;
  const reason = updateData.reason?.trim();

  if (!reason || reason.length < 15) {
    throw new Error("Alasan peminjaman terlalu pendek (Minimal 15 karakter).");
  }

  if (tenorMonths < 1 || tenorMonths > 12) {
    throw new Error("Tenor pinjaman berdurasi antara 1 sampai 12 bulan.");
  }

  const employee = await Employee.findOne({ userId });
  if (!employee) throw new Error("Data pegawai tidak ditemukan.");

  const loan = await Loan.findOne({ _id: loanId, employeeId: employee._id });
  if (!loan) throw new Error("Data pengajuan pinjaman tidak terdaftar.");

  if (loan.status !== "PENDING") {
    throw new Error("Pengajuan tidak dapat diedit karena status sudah berubah.");
  }

  const wadirApproval = await LoanApproval.findOne({ loanId, step: "WAKIL_DIREKTUR" });
  if (wadirApproval && wadirApproval.status !== "PENDING") {
    throw new Error("Akses edit ditolak, pengajuan telah ditinjau Wakil Direktur.");
  }

  const basicSalary = employee.financialData?.basicSalary || 0;
  const maxLoan = basicSalary * 3;
  if (amountRequested > maxLoan) {
    throw new Error(
      `Pinjaman melebihi batas maksimal 3x gaji pokok (Maksimal Rp ${maxLoan.toLocaleString("id-ID")}).`
    );
  }

  const monthlyDeduction = Math.ceil(amountRequested / tenorMonths);
  const maxDeduction = basicSalary * 0.3;
  if (monthlyDeduction > maxDeduction) {
    throw new Error(`Cicilan bulanan melebihi batas 30% dari plafon gaji pokok.`);
  }

  loan.amountRequested = amountRequested;
  loan.tenorMonths = tenorMonths;
  loan.monthlyDeduction = monthlyDeduction;
  loan.reason = reason;

  return await loan.save();
};

/**
 * Mengambil kompilasi data administrasi pinjaman untuk panel manajemen (Manajer Keuangan, Direksi, dll).
 * * @param {Object} user - Objek entitas user pelaksana yang sedang login dari session.
 * @param {string} user.role - Nama peran akses otorisasi user (misal: "DIREKTUR_UTAMA").
 * @returns {Promise<{activeLoans: Object[], historyLoans: Object[]}>} Kumpulan array yang dipisah menjadi antrean aktif dan rekam jejak riwayat masa lampau.
 */
export const getLoanManagementDataService = async (user) => {
  const roleName = (user.role || "").toString().trim().toUpperCase();

  const approvals = await LoanApproval.find({ step: roleName }).sort({ createdAt: -1 }).lean();
  const loanIds = approvals.map((app) => app.loanId);

  const loans = await Loan.find({
    _id: { $in: loanIds },
    status: { $ne: "CANCELLED" },
  })
    .populate({ path: "employeeId", select: "fullName" })
    .lean();

  const activeLoans = [];
  const historyLoans = [];

  for (const app of approvals) {
    const loan = loans.find((l) => l._id.toString() === app.loanId.toString());
    if (!loan) continue;

    const loanData = {
      ...loan,
      approvalId: app._id,
      approvalStatus: app.status,
      note: app.note,
    };

    if (app.status === "PENDING") {
      activeLoans.push(loanData);
    } else {
      historyLoans.push(loanData);
    }
  }

  return { activeLoans, historyLoans };
};

/**
 * Memproses aksi persetujuan (Approval) berkas pinjaman ke tahapan alur verifikasi selanjutnya.
 * * @param {string} approvalId - ID Antrean dokumen persetujuan (LoanApproval ID).
 * @param {Object} sessionUser - Objek data user peninjau yang mengeksekusi aksi dari session.
 * @param {string} sessionUser._id - ID Dokumen User peninjau.
 * @param {string} sessionUser.role - Judul otoritas peran user aktif.
 * @param {string} sessionUser.fullName - Nama terang peninjau untuk lampiran pelaporan.
 * @param {string} [note] - Catatan tambahan pertimbangan persetujuan dari jajaran direksi.
 * @returns {Promise<boolean>} Nilai true apabila seluruh rangkaian mutasi data dan pembuatan status sukses terlaksana.
 * @throws {Error} Jika antrean tidak valid, user melanggar hak otorisasi step, atau kondisi riwayat profil finansial pemohon mendadak berubah di luar batas aman.
 */
export const processApprovalService = async (approvalId, sessionUser, note) => {
  const approval = await LoanApproval.findOne({ _id: approvalId, status: "PENDING" });
  if (!approval) throw new Error("Antrean tidak ditemukan atau sudah diproses sebelumnya.");

  const userRole = (sessionUser.role || "").toString().trim().toUpperCase();
  if (approval.step !== userRole) {
    throw new Error(`Anda tidak memiliki otoritas. Tahap otentikasi saat ini: ${approval.step}`);
  }

  const loan = await Loan.findById(approval.loanId);
  if (!loan) throw new Error("Data finansial pinjaman induk tidak ditemukan.");

  const employee = await Employee.findById(loan.employeeId).lean();
  const basicSalary = employee?.financialData?.basicSalary || 0;

  if (loan.amountRequested > basicSalary * 3 || loan.monthlyDeduction > basicSalary * 0.3) {
    throw new Error(
      "Persetujuan digagalkan otomatis oleh sistem karena profil keuangan pegawai berubah."
    );
  }

  const cleanNote = note ? note.trim() : "";
  approval.status = "APPROVED";
  approval.note = cleanNote || "Disetujui oleh manajemen.";
  approval.approverId = sessionUser._id;
  approval.actionDate = new Date();
  await approval.save();

  const { nextStep, nextApproverId } = await getNextLoanApproverService(approval.step);

  if (nextStep) {
    await LoanApproval.create({
      loanId: approval.loanId,
      step: nextStep,
      approverId: nextApproverId,
      status: "PENDING",
      note: "",
    });

    if (nextApproverId) {
      try {
        const targetUrl =
          nextStep === "MANAGER_KEUANGAN" ? "/loans/disbursement" : "/loans/approval";

        await notificationService.createManyNotifications({
          userIds: [nextApproverId],
          senderId: sessionUser._id,
          senderName: sessionUser.fullName,
          title: "Persetujuan Pinjaman",
          text: `Berkas pinjaman ${employee.fullName} diteruskan ke Anda oleh ${userRole.replace(/_/g, " ")}.`,
          module: MODULES.LOAN,
          referenceId: loan._id,
          actionUrl: targetUrl,
          type: "EXPENSE",
          category: NOTIF_CATEGORIES.INFO,
        });
      } catch (err) {
        console.error("Gagal mengirim notifikasi kelanjutan approval:", err.message);
      }
    }
  } else {
    await Loan.findByIdAndUpdate(approval.loanId, { status: "APPROVED" });

    try {
      await notificationService.createManyNotifications({
        userIds: [employee.userId],
        senderId: sessionUser._id,
        senderName: sessionUser.fullName,
        title: "Pinjaman Disetujui",
        text: `Pengajuan pinjaman Anda telah disetujui penuh oleh Direksi. Menunggu pencairan dana oleh Keuangan.`,
        module: MODULES.LOAN,
        referenceId: loan._id,
        actionUrl: "/loans/me",
        type: "EXPENSE",
        category: NOTIF_CATEGORIES.SUCCESS,
      });
    } catch (err) {
      console.error("Gagal mengirim notifikasi final approval ke karyawan:", err.message);
    }
  }
  return true;
};

/**
 * Menolak (Reject) berkas aplikasi pengajuan pinjaman karyawan dan menghentikan seluruh workflow berjalan.
 * * @param {string} approvalId - ID Antrean dokumen persetujuan (LoanApproval ID).
 * @param {Object} sessionUser - Objek data user pengambil keputusan penolakan.
 * @param {string} sessionUser._id - ID User pengambil keputusan.
 * @param {string} sessionUser.role - Peran jabatan user aktif.
 * @param {string} sessionUser.fullName - Nama lengkap pengambil keputusan.
 * @param {string} [note] - Pesan berisi alasan penolakan berkas dari manajemen.
 * @returns {Promise<boolean>} Nilai true jika seluruh siklus penolakan dan pembatalan status pinjaman utama tuntas.
 * @throws {Error} Apabila entitas antrean nihil atau user melanggar batas hak otorisasi tahapan kerja.
 */
export const processRejectService = async (approvalId, sessionUser, note) => {
  const approval = await LoanApproval.findOne({ _id: approvalId, status: "PENDING" });
  if (!approval) throw new Error("Berkas antrean tidak ditemukan.");

  const userRole = (sessionUser.role || "").toString().trim().toUpperCase();
  if (approval.step !== userRole) {
    throw new Error("Anda tidak memiliki otoritas pada tahapan penolakan ini.");
  }

  const cleanNote = note ? note.trim() : "";
  approval.status = "REJECTED";
  approval.note = cleanNote || "Ditolak oleh manajemen.";
  approval.approverId = sessionUser._id;
  approval.actionDate = new Date();
  await approval.save();

  const loan = await Loan.findByIdAndUpdate(approval.loanId, { status: "REJECTED" });

  const employee = await Employee.findById(loan.employeeId).lean();
  if (employee && employee.userId) {
    try {
      await notificationService.createManyNotifications({
        userIds: [employee.userId],
        senderId: sessionUser._id,
        senderName: sessionUser.fullName,
        title: "Pinjaman Ditolak",
        text: `Pengajuan pinjaman Anda ditolak oleh ${userRole.replace(/_/g, " ")}. Catatan: ${approval.note}`,
        module: MODULES.LOAN,
        referenceId: loan._id,
        actionUrl: "/loans/me",
        type: "EXPENSE",
        category: NOTIF_CATEGORIES.DANGER,
      });
    } catch (err) {
      console.error("Gagal mengirim notifikasi penolakan ke karyawan:", err.message);
    }
  }

  return true;
};

/**
 * Memproses pencairan dana kas (Disbursement) pinjaman oleh Manajer Keuangan, sekaligus mengunggah bukti transfer bank dan menginisiasi skema tabel cicilan tenor otomatis.
 * * @param {string} approvalId - ID Antrean peninjauan transaksi (LoanApproval ID).
 * @param {Object} sessionUser - Objek pengguna kas keuangan yang berwenang melayani transaksi.
 * @param {string} sessionUser._id - ID User kasir/manajer keuangan penanggung jawab.
 * @param {string} sessionUser.fullName - Nama lengkap pengelola keuangan.
 * @param {string} [note] - Catatan tambahan operasional pencairan dana dari divisi akuntansi.
 * @param {Object} file - Objek file berkas bukti transfer perbankan yang diunggah dari middleware (Express/Multer).
 * @param {string} file.filename - Nama berkas fisik penunjang bukti pencairan dana di penyimpanan server.
 * @returns {Promise<boolean>} Nilai true bila seluruh proses mutasi pencairan kas dan penyisipan data angsuran massal sukses disimpan.
 * @throws {Error} Bila berkas lampiran bukti transfer bank kosong atau ID antrean kas tidak valid.
 */
export const processDisbursementService = async (approvalId, sessionUser, note, file) => {
  if (!file) throw new Error("Dokumen Bukti Transfer Bank (Pencairan) wajib dilampirkan.");

  const approval = await LoanApproval.findOne({
    _id: approvalId,
    step: "MANAGER_KEUANGAN",
    status: "PENDING",
  });
  if (!approval) throw new Error("Antrean transaksi pencairan kas tidak valid.");

  const cleanNote = note ? note.trim() : "";
  approval.status = "APPROVED";
  approval.note = cleanNote || "Dana pinjaman telah ditransfer via Finance Center.";
  approval.approverId = sessionUser._id;
  approval.actionDate = new Date();
  await approval.save();

  const loan = await Loan.findById(approval.loanId);
  if (!loan) throw new Error("Data pinjaman terkait tidak ditemukan.");

  loan.status = "APPROVED";
  loan.disbursementDate = new Date();
  loan.paymentProof = `/uploads/files/${file.filename}`;
  await loan.save();

  const paymentRecords = [];
  const initialPeriod = getPayrollPeriod(loan.disbursementDate);
  const [startYear, startMonthStr] = initialPeriod.id.split("-").map(Number);
  const baseMonthIndex = startMonthStr - 1;

  for (let i = 1; i <= loan.tenorMonths; i++) {
    const nextDate = new Date(Date.UTC(startYear, baseMonthIndex + (i - 1), 1));
    const currentPeriod = getPayrollPeriod(nextDate);

    paymentRecords.push({
      loanId: loan._id,
      employeeId: loan.employeeId,
      installmentNumber: i,
      amount: loan.monthlyDeduction,
      periodMonth: currentPeriod.id,
      isPaid: false,
    });
  }

  await LoanPayment.insertMany(paymentRecords);

  const employee = await Employee.findById(loan.employeeId).lean();
  if (employee && employee.userId) {
    try {
      await notificationService.createManyNotifications({
        userIds: [employee.userId],
        senderId: sessionUser._id,
        senderName: sessionUser.fullName,
        title: "Dana Pinjaman Dicairkan",
        text: `Dana pinjaman sebesar Rp ${loan.amountRequested.toLocaleString("id-ID")} telah ditransfer ke rekening Anda.`,
        module: MODULES.LOAN,
        referenceId: loan._id,
        actionUrl: "/loans/me",
        type: "EXPENSE",
        category: NOTIF_CATEGORIES.SUCCESS,
      });
    } catch (err) {
      console.error("Gagal mengirim notifikasi pencairan dana:", err.message);
    }
  }

  return true;
};

/**
 * Membatalkan aplikasi permohonan pinjaman mandiri secara sepihak oleh karyawan pemohon sebelum disetujui penuh / masuk kas keuangan.
 * * @param {string} loanId - ID Dokumen pinjaman yang hendak dibatalkan.
 * @param {string} userId - ID Pengguna (User ID) dari karyawan pemilik dokumen pinjaman.
 * @returns {Promise<Object>} Berkas pinjaman induk yang diubah statusnya menjadi CANCELLED.
 * @throws {Error} Jika dokumen nihil, user tidak punya hak kepemilikan dokumen, pinjaman terlanjur berstatus APPROVED, atau sudah berstatus REJECTED/CANCELLED sebelumnya.
 */
export const cancelLoanService = async (loanId, userId) => {
  const loan = await Loan.findById(loanId);
  if (!loan) throw new Error("Data pengajuan tidak ditemukan.");

  const employee = await Employee.findOne({ userId }).lean();
  if (!employee || loan.employeeId.toString() !== employee._id.toString()) {
    throw new Error("Anda tidak mempunyai hak otorisasi membatalkan pengajuan ini.");
  }

  if (loan.status === "APPROVED") {
    throw new Error("Pembatalan ditolak. Pengajuan sudah disetujui / dalam antrean kas.");
  }

  if (["REJECTED", "CANCELLED"].includes(loan.status)) {
    throw new Error(`Pengajuan ini sudah berstatus ${loan.status}`);
  }

  loan.status = "CANCELLED";
  await loan.save();

  await LoanApproval.updateMany(
    { loanId: loan._id, status: "PENDING" },
    { status: "CANCELLED", approverId: null, note: "Dibatalkan oleh pemohon" }
  );

  return loan;
};
