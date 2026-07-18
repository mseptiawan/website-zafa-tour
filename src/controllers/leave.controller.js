import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import {
  calculateLeaveDaysService,
  findLeaveManagementCenterDataService,
  createHolidayService,
  updateHolidayService,
  toggleHolidayStatusService,
  deleteHolidayService,
  generateOrResetLeaveBalanceService,
  getApplyLeaveFormDataService,
  applyLeaveService,
  getUserLeaveHistoryService,
  getLeaveDetailService,
  getEditLeaveDataService,
  updateLeaveService,
  cancelPendingLeaveService,
  requestCancelApprovedLeaveService,
  getResubmitLeaveDataService,
  getMyDelegationsService,
  approveDelegationService,
  rejectDelegationService,
  getPendingApprovalsDataService,
  approveLeaveService,
  rejectLeaveService,
  getManageLeavePageDataService,
} from "../services/leave.service.js";
import LeaveType from "../models/leave/LeaveType.model.js";
import User from "../models/basic/User.model.js";
import LeaveBalance from "../models/leave/LeaveBalance.model.js";

// ─── METHOD 1: API HITUNG HARI KERJA CUTI ─────────────────
export const calculateLeaveDays = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const totalDays = await calculateLeaveDaysService({ startDate, endDate });

    return res.status(200).json({
      success: true,
      totalDays,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal menghitung kalkulasi durasi hari cuti.",
    });
  }
});

// ─── METHOD 2: PUSAT ADMINISTRASI & KALENDER VIEW ─────────
export const getHolidaysPage = asyncHandler(async (req, res) => {
  try {
    const dataManagement = await findLeaveManagementCenterDataService({
      currentUser: req.session.user || req.user,
      yearQuery: req.query.year,
    });

    res.render("leave/manage-center", {
      ...buildRenderData(req, {
        title: "Pusat Administrasi Cuti",
        user: req.session.user || req.user,
        ...dataManagement,
      }),
    });
  } catch (error) {
    return res.status(500).render("error", {
      title: "Kalender Manajemen - Error",
      message: error.message,
    });
  }
});

// ─── METHOD 3: SIMPAN DATA HARI LIBUR / AGENDA BARU ───────
export const createHoliday = asyncHandler(async (req, res) => {
  try {
    await createHolidayService({ body: req.body });

    req.flash("success", "Agenda kalender perusahaan berhasil didaftarkan!");
    await new Promise((resolve) => req.session.save(resolve));

    return res.redirect("/leave/manage-calendar?tab=calendar");
  } catch (error) {
    req.flash("error", `Gagal menyimpan agenda: ${error.message}`);
    await new Promise((resolve) => req.session.save(resolve));

    return res.status(500).render("error", {
      title: "Tambah Agenda - Error",
      message: error.message,
    });
  }
});

// ─── METHOD 4: UPDATE DATA AGENDA LIBUR ───────────────────
export const updateHoliday = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.session.user || req.user;

    await updateHolidayService({
      id,
      body: req.body,
      currentUser,
    });

    req.flash("success", "Perubahan agenda kalender berhasil diperbarui!");
    await new Promise((resolve) => req.session.save(resolve));

    return res.redirect("/leave/manage-calendar?tab=calendar");
  } catch (error) {
    // Penanganan khusus jika role user tidak diizinkan (403)
    if (error.statusCode === 403) {
      req.flash("error", error.message);
      await new Promise((resolve) => req.session.save(resolve));
      return res.redirect("/leave/manage-calendar?tab=calendar");
    }

    return res.status(error.statusCode || 500).render("error", {
      title: "Update Agenda - Error",
      message: error.message,
    });
  }
});
// ─── METHOD 5: TOGGLE STATUS AGENDA (JSON RESPONSE) ──────
export const toggleHolidayStatus = asyncHandler(async (req, res) => {
  try {
    const currentUser = req.session.user || req.user;
    const holiday = await toggleHolidayStatusService({
      id: req.params.id,
      currentUser,
    });

    return res.status(200).json({
      success: true,
      message: `Hari libur berhasil ${holiday.isActive ? "diaktifkan kembali" : "dinonaktifkan (diarsipkan)"}.`,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mengubah status keaktifan agenda.",
    });
  }
});

// ─── METHOD 6: HAPUS AGENDA LIBUR (JSON RESPONSE) ─────────
export const deleteHoliday = asyncHandler(async (req, res) => {
  try {
    await deleteHolidayService({ id: req.params.id });
    return res.status(200).json({
      success: true,
      message: "Hari libur berhasil dihapus secara permanen.",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Gagal mengeksekusi penghapusan agenda.",
    });
  }
});

// ─── METHOD 7: INVENTARISASI & RESET SALDO CUTI PEGAWAI ───
export const generateOrResetLeaveBalance = asyncHandler(async (req, res) => {
  try {
    const targetYear = await generateOrResetLeaveBalanceService({
      yearInput: req.body.year,
    });

    req.flash("success", `Kalkulasi ulang saldo cuti tahun ${targetYear} berhasil diperbarui.`);
    await new Promise((resolve) => req.session.save(resolve));

    return res.redirect(`/leave/manage-requests?tab=balances&status=success&year=${targetYear}`);
  } catch (error) {
    req.flash("error", `Gagal memproses reset kuota: ${error.message}`);
    await new Promise((resolve) => req.session.save(resolve));

    return res.status(error.statusCode || 500).render("error", {
      title: "Reset Saldo - Error",
      message: error.message,
    });
  }
});

// ─── METHOD 8: TAMPILKAN HALAMAN FORM PENGAJUAN CUTI ──────
export const showApplyLeave = asyncHandler(async (req, res) => {
  try {
    const currentUser = req.session.user || req.user;
    const formData = await getApplyLeaveFormDataService({ userId: currentUser._id });

    return res.render("leave/create", {
      ...buildRenderData(req, {
        title: "Pengajuan Cuti Mandiri",
        mode: "CREATE",
        leave: null,
        error: null,
        ...formData,
      }),
    });
  } catch (error) {
    return res.status(500).render("error", {
      title: "Form Pengajuan - Error",
      message: error.message,
    });
  }
});

// ─── METHOD 9: SUBMIT DATA FORM PENGAJUAN CUTI ────────────
export const applyLeave = asyncHandler(async (req, res) => {
  const currentUser = req.session.user || req.user;

  try {
    await applyLeaveService({
      body: req.body,
      currentUser,
      file: req.file,
    });

    req.flash("success", "Pengajuan cuti berhasil didaftarkan ke dalam sistem!");
    await new Promise((resolve) => req.session.save(resolve));

    return res.redirect("/leave/me");
  } catch (error) {
    console.error("Error pada applyLeave Controller:", error);

    // Rollback view state untuk merender pesan error internal secara presisi di form
    const currentYear = new Date(req.body.startDate || Date.now()).getFullYear();
    const [leaveTypes, employees, balance] = await Promise.all([
      LeaveType.find({}),
      User.find({ _id: { $ne: currentUser._id } }).populate("employeeData", "fullName"),
      LeaveBalance.findOne({ userId: currentUser._id, year: currentYear }),
    ]);

    return res.status(error.statusCode || 500).render("leave/create", {
      ...buildRenderData(req, {
        title: "Input Pengajuan Cuti",
        mode: "CREATE",
        error: error.message || "Terjadi kesalahan internal. Silakan coba kembali.",
        leaveTypes,
        employees,
        leaveBalance: balance || { remaining: 0 },
        leave: {
          leaveTypeId: req.body.leaveTypeId,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          reason: req.body.reason,
          handoverUserId: req.body.handoverUserId,
          totalDays: 0,
        },
        employee: currentUser,
      }),
    });
  }
});

// ─── METHOD 10: VIEW TRACKING RIWAYAT CUTI SAYA ───────────
export const myLeave = asyncHandler(async (req, res) => {
  try {
    const currentUser = req.session.user || req.user;
    const historyData = await getUserLeaveHistoryService({ userId: currentUser._id });

    return res.render("leave/history", {
      ...buildRenderData(req, {
        title: "Riwayat Cuti Saya",
        ...historyData,
      }),
    });
  } catch (error) {
    return res.status(500).render("error", {
      title: "Riwayat Cuti - Error",
      message: error.message,
    });
  }
});

// ─── METHOD 11: HALAMAN RIWAYAT DETAIL KELAYAKAN CUTI ─────
export const getLeaveDetail = asyncHandler(async (req, res) => {
  try {
    const detailData = await getLeaveDetailService({ id: req.params.id });

    return res.render("leave/detail", {
      ...buildRenderData(req, {
        title: "Detail Pengajuan Cuti",
        user: req.session.user || req.user,
        ...detailData,
      }),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).render("error", {
      title: "Detail Cuti - Error",
      message: error.message,
    });
  }
});

// ─── METHOD 12: VIEW FORM EDIT DOKUMEN CUTI PENDING ───────
export const editLeave = asyncHandler(async (req, res) => {
  try {
    const currentUser = req.session.user || req.user;
    const editData = await getEditLeaveDataService({
      id: req.params.id,
      userId: currentUser._id,
    });

    return res.render("leave/create", {
      ...buildRenderData(req, {
        title: "Edit Form Cuti",
        mode: "EDIT",
        error: null,
        ...editData,
      }),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).render("error", {
      title: "Ubah Cuti - Error",
      message: error.message,
    });
  }
});

// ─── METHOD 13: EKSEKUSI DATA FORM MODIFIKASI CUTI ────────
export const updateLeave = asyncHandler(async (req, res) => {
  try {
    const currentUser = req.session.user || req.user;
    await updateLeaveService({
      id: req.params.id,
      body: req.body,
      currentUser,
    });

    req.flash("success", "Pembaruan rincian pengajuan cuti berhasil diproses.");
    await new Promise((resolve) => req.session.save(resolve));

    return res.redirect("/leave/me");
  } catch (error) {
    return res.status(error.statusCode || 500).render("error", {
      title: "Pembaruan Dokumen - Error",
      message: error.message,
    });
  }
});

// ─── METHOD 14: DROP / BATALKAN PENGAJUAN STATUS PENDING ──
export const cancelPendingLeave = asyncHandler(async (req, res) => {
  try {
    await cancelPendingLeaveService({ id: req.params.id });

    req.flash("success", "Pengajuan izin cuti Anda berhasil dibatalkan.");
  } catch (error) {
    req.flash("error", error.message || "Gagal memproses pembatalan berkas.");
  }

  await new Promise((resolve) => req.session.save(resolve));
  return res.redirect("/leave/me");
});

// ─── METHOD 15: PERMINTAAN PEMBATALAN CUTI YANG TERSETUJUI ─
export const requestCancelApprovedLeave = asyncHandler(async (req, res) => {
  const currentUser = req.session.user || req.user;
  if (!currentUser) {
    return res.redirect("/?error=SESSION_EXPIRED");
  }

  try {
    await requestCancelApprovedLeaveService({
      id: req.params.id,
      body: req.body,
      currentUser,
    });

    req.flash("success", "Permohonan pembatalan cuti diserahkan ke jenjang struktural.");
    await new Promise((resolve) => req.session.save(resolve));

    return res.redirect("/leave/me");
  } catch (error) {
    return res.status(error.statusCode || 500).render("error", {
      title: "Error Pembatalan",
      message: error.message,
    });
  }
});

// ─── METHOD 16: VIEW FORM AJUKAN ULANG BERKAS TOLAKAN ─────
export const showResubmitLeave = asyncHandler(async (req, res) => {
  try {
    const currentUser = req.session.user || req.user;
    const resubmitData = await getResubmitLeaveDataService({
      id: req.params.id,
      userId: currentUser._id,
    });

    return res.render("leave/create", {
      ...buildRenderData(req, {
        title: "Ajukan Ulang Cuti",
        mode: "RESUBMIT",
        error: null,
        ...resubmitData,
      }),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).render("error", {
      title: "Ajukan Ulang - Error",
      message: error.message,
    });
  }
});

// ─── METHOD 17: DASHBOARD DAFTAR LIMPAHAN DELEGASI TUGAS ──
export const myDelegations = asyncHandler(async (req, res) => {
  try {
    const currentUser = req.session.user || req.user;
    const delegationData = await getMyDelegationsService({ userId: currentUser._id });

    return res.render("leave/delegation", {
      ...buildRenderData(req, {
        title: "Delegasi Tugas Saya",
        ...delegationData,
      }),
    });
  } catch (error) {
    return res.status(500).render("error", {
      title: "Delegasi Error",
      message: error.message,
    });
  }
});

// ─── METHOD 18: VALIDASI PERSETUJUAN DELEGASI PEGAWAI ─────
export const approveDelegation = asyncHandler(async (req, res) => {
  const currentUser = req.session.user || req.user;
  if (!currentUser) {
    return res.status(401).render("error", {
      title: "Error Sesi",
      message: "Sesi kerja Anda berakhir. Silakan login kembali.",
    });
  }

  try {
    await approveDelegationService({
      id: req.params.id,
      body: req.body,
      currentUser,
    });

    req.flash("success", "Serah terima pelimpahan tugas disetujui, berkas diteruskan.");
    await new Promise((resolve) => req.session.save(resolve));

    return res.redirect("/leave/my-delegations");
  } catch (error) {
    return res.status(error.statusCode || 500).render("error", {
      title: "Error Kelola Delegasi",
      message: error.message,
    });
  }
});

// ─── METHOD 19: TOLAK TANGGUNG JAWAB LIMPAHAN DELEGASI ────
export const rejectDelegation = asyncHandler(async (req, res) => {
  try {
    const currentUser = req.session.user || req.user;
    await rejectDelegationService({
      id: req.params.id,
      body: req.body,
      currentUser,
    });

    req.flash("success", "Pelimpahan delegasi tugas berhasil ditolak.");
    await new Promise((resolve) => req.session.save(resolve));

    return res.redirect("/leave/my-delegations");
  } catch (error) {
    return res.status(error.statusCode || 500).render("error", {
      title: "Penolakan Delegasi - Error",
      message: error.message,
    });
  }
});

// ─── METHOD 20: TAMPILKAN DAFTAR ANTREAN PERSETUJUAN ──────
export const showApprovals = asyncHandler(async (req, res) => {
  try {
    const currentUser = req.session.user || req.user;
    const approvalData = await getPendingApprovalsDataService({ currentUser });

    return res.render("leave/approvals", {
      ...buildRenderData(req, {
        title: "Persertujuan Cuti Pegawai",
        ...approvalData,
      }),
    });
  } catch (error) {
    return res.status(500).render("error", {
      title: "Daftar Persetujuan - Error",
      message: error.message,
    });
  }
});

// ─── METHOD 21: EXEKUSI PERSETUJUAN DOKUMEN IZIN CUTI ─────
export const approveLeave = asyncHandler(async (req, res) => {
  const currentUser = req.session.user || req.user;
  if (!currentUser) {
    return res.status(401).render("error", {
      title: "Sesi Kedaluwarsa",
      message: "Sesi Anda telah berakhir. Silakan melakukan login ulang.",
    });
  }

  try {
    await approveLeaveService({
      id: req.params.id,
      body: req.body,
      currentUser,
    });

    req.flash("success", "Dokumen permohonan berhasil disetujui.");
    await new Promise((resolve) => req.session.save(resolve));

    return res.redirect("/leave/manage-requests");
  } catch (error) {
    console.error("Error pada approveLeave Controller:", error);
    return res.status(error.statusCode || 500).render("error", {
      title: "Persetujuan Gagal",
      message: error.message,
    });
  }
});

// ─── METHOD 22: EKSEKUSI PENOLAKAN PERMOHONAN CUTI ────────
export const rejectLeave = asyncHandler(async (req, res) => {
  const currentUser = req.session.user || req.user;
  if (!currentUser) {
    return res.status(401).render("error", {
      title: "Sesi Kedaluwarsa",
      message: "Sesi Anda telah berakhir. Silakan login kembali.",
    });
  }

  try {
    await rejectLeaveService({
      id: req.params.id,
      body: req.body,
      currentUser,
    });

    req.flash("success", "Pengajuan permohonan cuti pegawai resmi ditolak.");
    await new Promise((resolve) => req.session.save(resolve));

    return res.redirect("/leave/manage-requests");
  } catch (error) {
    return res.status(error.statusCode || 500).render("error", {
      title: "Penolakan Gagal",
      message: error.message,
    });
  }
});

// ─── METHOD 23: PUSAT PENGENDALIAN ADMINISTRASI CUTI VIEW ─
export const getManageLeavePage = asyncHandler(async (req, res) => {
  const currentUser = req.session.user || req.user;
  if (!currentUser) {
    return res.redirect("/?error=UNAUTHORIZED");
  }

  try {
    const pageData = await getManageLeavePageDataService({
      currentUser,
      yearQuery: req.query.year,
    });

    return res.render("leave/manage-center", {
      ...buildRenderData(req, {
        title: "Pusat Manajemen Cuti",
        user: currentUser,
        ...pageData,
      }),
    });
  } catch (error) {
    return res.status(500).render("error", {
      title: "Pusat Manajemen Cuti - Error",
      message: error.message,
    });
  }
});
