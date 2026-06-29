import Permit from "../models/Permit.model.js";
import Employee from "../models/employee/Employee.model.js";
import User from "../models/basic/User.model.js";
import Role from "../models/basic/Role.model.js";
import notificationService from "./notification.service.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import { MODULES, NOTIF_CATEGORIES } from "../config/constants.js";

/**
 * Membuat dokumen permohonan izin baru beserta pengiriman notifikasi otomatis ke atasan.
 * @param {Object} params
 * @param {Object} params.body - Payload data form perizinan
 * @param {Object} [params.file] - File surat bukti / resep dokter dari Multer
 * @param {Object} params.currentUser - Objek session user aktif
 * @returns {Promise<Object>} Instance data Permit terbuat
 */
export const createPermit = async ({ body, file, currentUser }) => {
  const { type, date, reason } = body;

  if (type === "SAKIT" && !file) {
    const error = new Error("Izin sakit wajib menyertakan dokumen surat keterangan dokter.");
    error.statusCode = 400;
    error.field = "document";
    throw error;
  }

  const documentPath = file ? `/uploads/files/${file.filename}` : null;

  const permit = await Permit.create({
    employeeId: currentUser.employeeId,
    type,
    date,
    reason,
    document: documentPath,
  });

  // Timbal balik notifikasi otomatis ke Wakil Direktur sebagai pintu pertama otorisasi
  try {
    const targetRole = await Role.findOne({ name: "WAKIL_DIREKTUR" }).lean();
    if (targetRole) {
      const reviewers = await User.find({ roleId: targetRole._id }).select("_id").lean();
      const reviewerUserIds = reviewers.map((rev) => rev._id);

      if (reviewerUserIds.length > 0) {
        await notificationService.createManyNotifications({
          userIds: reviewerUserIds,
          senderId: currentUser._id,
          senderName: currentUser.fullName,
          title: "Permohonan Izin Baru",
          text: `${currentUser.fullName} mengajukan permohonan "${type.replace(/_/g, " ")}" untuk tanggal ${date}.`,
          module: MODULES.PERMIT || "PERMIT",
          referenceId: permit._id,
          actionUrl: "/permit/incoming",
          type: "PERMIT",
          category: NOTIF_CATEGORIES.INFO,
        });
      }
    }
  } catch (notifError) {
    console.error("Gagal mengirimkan notifikasi pengajuan izin:", notifError.message);
  }

  return permit;
};

/**
 * Mengambil histori pengajuan izin personal milik karyawan aktif (Terpaginasi).
 * @param {Object} params
 * @param {string} params.employeeId - ID Karyawan aktif dari session
 * @param {number|string} params.page - Halaman aktif saat ini
 * @returns {Promise<{data: Array, meta: Object}>} Log riwayat perizinan terpaginasi
 */
export const findEmployeeHistory = async ({ employeeId, page }) => {
  const paginationArgs = getPagination({ page, limit: 10 });
  const filter = { employeeId };

  const total = await Permit.countDocuments(filter);
  const data = await Permit.find(filter)
    .populate({
      path: "employeeId",
      select: "fullName employeeIdNumber",
    })
    .sort({ createdAt: -1 })
    .skip(paginationArgs.skip)
    .limit(paginationArgs.limit)
    .lean();

  return {
    data,
    meta: getPaginationMeta({ page: paginationArgs.page, limit: paginationArgs.limit, total }),
  };
};

/**
 * Mengambil daftar antrean permohonan izin masuk yang menjadi wewenang approver berdasarkan kebijakan struktural (Terpaginasi).
 * @param {Object} params
 * @param {Object} params.currentUser - Properti session pengguna yang meninjau rute
 * @param {number|string} params.page - Nomor halaman antrean aktif
 * @returns {Promise<{data: Array, meta: Object, summary: Object}>} Berkas izin masuk beserta metrik rangkumannya
 */
export const findIncomingPermits = async ({ currentUser, page }) => {
  const paginationArgs = getPagination({ page, limit: 10 });
  const userRoleName = currentUser.role?.toUpperCase();

  const wadirRole = await Role.findOne({ name: "WAKIL_DIREKTUR" }).lean();
  const wadirEmployeeIds = wadirRole
    ? await Employee.find({ roleId: wadirRole._id }).distinct("_id")
    : [];

  let query = { _id: null }; // Default aman jika bukan merupakan jajaran direksi

  if (userRoleName === "DIREKTUR_UTAMA") {
    // Direktur Utama meninjau pengajuan khusus dari Wakil Direktur
    query = { employeeId: { $in: wadirEmployeeIds, $ne: currentUser.employeeId } };
  } else if (userRoleName === "WAKIL_DIREKTUR") {
    // Wakil Direktur mengelola seluruh perizinan staf di bawahnya (Kecuali direksi)
    query = { employeeId: { $nin: wadirEmployeeIds, $ne: currentUser.employeeId } };
  }

  const total = await Permit.countDocuments(query);
  const data = await Permit.find(query)
    .populate({
      path: "employeeId",
      select: "fullName employeeIdNumber foto_profile",
      populate: {
        path: "careerData",
        populate: { path: "bidangId", select: "name" },
      },
    })
    .sort({ createdAt: -1 })
    .skip(paginationArgs.skip)
    .limit(paginationArgs.limit)
    .lean();

  const summary = {
    totalPermits: total,
    approved: await Permit.countDocuments({ ...query, status: "APPROVED" }),
    pending: await Permit.countDocuments({ ...query, status: "PENDING" }),
    rejected: await Permit.countDocuments({ ...query, status: "REJECTED" }),
  };

  return {
    data,
    meta: getPaginationMeta({ page: paginationArgs.page, limit: paginationArgs.limit, total }),
    summary,
  };
};

/**
 * Memproses otorisasi persetujuan / penolakan pengajuan izin dengan validasi hirarki ketat.
 * @param {Object} params
 * @param {string} params.id - ID Permohonan izin target
 * @param {string} params.status - Hasil keputusan ('APPROVED' / 'REJECTED')
 * @param {string} [params.notesByApprover] - Catatan atau alasan peninjau dari form
 * @param {Object} params.currentUser - Profil atasan peninjau keputusan
 * @returns {Promise<Object>} Dokumen hasil eksekusi pembaruan perizinan
 */
export const executeApproval = async ({ id, status, notesByApprover, currentUser }) => {
  if (!["APPROVED", "REJECTED"].includes(status)) {
    const error = new Error("Aksi keputusan status otorisasi tidak valid.");
    error.statusCode = 400;
    throw error;
  }

  const permit = await Permit.findById(id).populate({
    path: "employeeId",
    select: "fullName userId",
    populate: { path: "userId", populate: { path: "roleId" } },
  });

  if (!permit) {
    const error = new Error("Data pengajuan permohonan perizinan tidak ditemukan.");
    error.statusCode = 404;
    throw error;
  }

  const targetRoleName = permit.employeeId?.userId?.roleId?.name?.toUpperCase();
  const approverRoleName = currentUser.role?.toUpperCase();

  // Memaksa kepatuhan gerbang birokrasi penandatanganan struktur internal perusahaan
  if (targetRoleName === "WAKIL_DIREKTUR") {
    if (approverRoleName !== "DIREKTUR_UTAMA") {
      const error = new Error(
        "Akses Otoritas Ditolak: Hanya Direktur Utama yang berhak memproses berkas Wakil Direktur."
      );
      error.statusCode = 403;
      throw error;
    }
  } else {
    if (approverRoleName !== "WAKIL_DIREKTUR" && approverRoleName !== "DIREKTUR_UTAMA") {
      const error = new Error(
        "Akses Otoritas Ditolak: Hak otorisasi izin staf didelegasikan kepada Wakil Direktur."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  permit.status = status;
  permit.approvedBy = currentUser.employeeId;
  permit.approvalDate = new Date();
  permit.notesByApprover = notesByApprover || null;
  await permit.save();

  // Pengiriman balik notifikasi langsung ke akun personal pemohon
  try {
    const statusEmoji = status === "APPROVED" ? "✅" : "❌";
    await notificationService.createNotification({
      userId: permit.employeeId.userId._id,
      senderId: currentUser._id,
      senderName: currentUser.fullName,
      title: `Status Perizinan: ${status} ${statusEmoji}`,
      text: `Pengajuan izin Anda telah ${status === "APPROVED" ? "disetujui" : "ditolak"}. Catatan: "${notesByApprover || "-"}"`,
      module: MODULES.PERMIT || "PERMIT",
      referenceId: permit._id,
      actionUrl: "/permit/history",
      type: "PERMIT",
      category: NOTIF_CATEGORIES.INFO,
    });
  } catch (notifError) {
    console.error("Gagal mendistribusikan notifikasi keputusan izin:", notifError.message);
  }

  return permit;
};
