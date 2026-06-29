import Permit from "../models/Permit.model.js";
import Employee from "../models/employee/Employee.model.js";
import User from "../models/basic/User.model.js";
import Role from "../models/basic/Role.model.js";
import fs from "fs";

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

  try {
    let targetRoleName = "WAKIL_DIREKTUR";
    if (currentUser.role?.toUpperCase() === "WAKIL_DIREKTUR") {
      targetRoleName = "DIREKTUR_UTAMA";
    }

    const targetRole = await Role.findOne({ name: targetRoleName }).lean();
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
/**
 * Mengambil daftar antrean permohonan izin masuk yang menjadi wewenang approver berdasarkan kebijakan struktural (Terpaginasi).
 */
export const findIncomingPermits = async ({ currentUser, page }) => {
  const paginationArgs = getPagination({ page, limit: 10 });
  const userRoleName = currentUser.role?.toUpperCase();

  const wadirRole = await Role.findOne({ name: "WAKIL_DIREKTUR" }).lean();

  const wadirUsers = wadirRole ? await User.find({ roleId: wadirRole._id }).distinct("_id") : [];

  const wadirEmployeeIds =
    wadirUsers.length > 0
      ? await Employee.find({ userId: { $in: wadirUsers } }).distinct("_id")
      : [];

  let query = { _id: null };

  if (userRoleName === "DIREKTUR_UTAMA") {
    query = {
      employeeId: { $in: wadirEmployeeIds, $ne: currentUser.employeeId },
      status: "PENDING",
    };
  } else if (userRoleName === "WAKIL_DIREKTUR") {
    query = {
      employeeId: { $nin: wadirEmployeeIds, $ne: currentUser.employeeId },
      status: "PENDING",
    };
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
    approved: await Permit.countDocuments({ employeeId: query.employeeId, status: "APPROVED" }),
    pending: await Permit.countDocuments({ employeeId: query.employeeId, status: "PENDING" }),
    rejected: await Permit.countDocuments({ employeeId: query.employeeId, status: "REJECTED" }),
    cancelled: await Permit.countDocuments({ employeeId: query.employeeId, status: "CANCELLED" }),
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
    await notificationService.createNotification({
      userId: permit.employeeId.userId._id,
      senderId: currentUser._id,
      senderName: currentUser.fullName,
      title: `Status Perizinan: ${status}`,
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
/**
 * @typedef {Object} EmployeeIdPopulated
 * @property {string} _id - ID MongoDB milik dokumen pegawai.
 * @property {string} fullName - Nama lengkap pegawai.
 * @property {Object} [careerData] - Informasi karir pegawai.
 * @property {Object} [careerData.bidangId] - Referensi dokumen bidang/divisi.
 * @property {string} [careerData.bidangId.name] - Nama bidang/divisi kerja pegawai.
 */

/**
 * @typedef {Object} PermitDocument
 * @property {string} _id - ID unik dokumen izin.
 * @property {string|EmployeeIdPopulated} employeeId - ID pegawai atau objek data pegawai yang di-populate.
 * @property {'PENDING'|'APPROVED'|'REJECTED'|'CANCELLED'} status - Status pemrosesan berkas.
 * @property {'SAKIT'|'PENDAMPINGAN_MELAHIRKAN'|'MUSIBAH'|'PENTING'|'KEPERLUAN_KELUARGA'|'KEPERLUAN_MENDESAK'|'LAINNYA'} type - Jenis izin yang diajukan.
 * @property {string|Date} date - Tanggal izin yang diajukan.
 * @property {string} reason - Deskripsi alasan pengajuan.
 * @property {string} [document] - Path URL file lampiran dokumen pendukung.
 * @property {string} [notesByApprover] - Catatan evaluasi dari atasan / peninjau.
 */

/**
 * Mengambil satu data berkas izin untuk form edit dengan validasi kepemilikan dan status.
 * * @async
 * @function getPermitForEdit
 * @param {Object} payload - Objek parameter fungsi.
 * @param {string} payload.id - ID dokumen perizinan (`_id`) yang ingin dicari.
 * @param {string} payload.employeeId - ID pegawai milik pemohon untuk memastikan validasi kepemilikan berkas.
 * @returns {Promise<PermitDocument>} Mengembalikan objek dokumen izin dalam format POJO (Plain Old JavaScript Object) lewat `.lean()`.
 * * @throws {Error} Melempar error dengan `statusCode = 404` jika berkas tidak ditemukan atau bukan milik pegawai tersebut.
 * @throws {Error} Melempar error dengan `statusCode = 400` jika status berkas sudah diproses (`APPROVED`/`REJECTED`/`CANCELLED`).
 */
export const getPermitForEdit = async ({ id, employeeId }) => {
  const permit = await Permit.findOne({ _id: id, employeeId }).lean();

  if (!permit) {
    const error = new Error("Data pengajuan perizinan tidak ditemukan.");
    error.statusCode = 404;
    throw error;
  }

  if (permit.status !== "PENDING") {
    const error = new Error("Akses Ditolak: Berkas telah diproses dan tidak dapat diubah lagi.");
    error.statusCode = 400;
    throw error;
  }

  return permit;
};

/**
 * Memperbarui berkas dokumen perizinan dari sisi karyawan.
 * Melakukan penggantian file fisik lama jika terdapat berkas upload baru yang dikirimkan.
 * * @async
 * @function updatePermit
 * @param {Object} payload - Objek parameter fungsi.
 * @param {string} payload.id - ID dokumen perizinan (`_id`) yang akan diubah.
 * @param {Object} payload.body - Objek data formulir yang dikirim melalui `req.body`.
 * @param {string} payload.body.type - Jenis tipe izin baru yang dipilih.
 * @param {string|Date} payload.body.date - Tanggal izin baru yang diajukan.
 * @param {string} payload.body.reason - Deskripsi alasan pembaruan pengajuan izin.
 * @param {Object} [payload.file] - Objek file dokumen baru hasil unggahan `multer` (`req.file`).
 * @param {string} payload.file.filename - Nama file baru yang tersimpan di storage server.
 * @param {Object} payload.currentUser - Objek data user aktif yang sedang login (`req.session.user`).
 * @param {string} payload.currentUser.employeeId - ID pegawai dari user untuk pengecekan kepemilikan.
 * @returns {Promise<Object>} Mengembalikan dokumen Mongoose instance dari berkas izin yang diperbarui.
 * * @throws {Error} Melempar error dengan `statusCode = 404` jika data pengajuan tidak ditemukan.
 * @throws {Error} Melempar error dengan `statusCode = 400` jika dokumen perizinan telah dievaluasi oleh atasan.
 * @throws {Error} Melempar error dengan `statusCode = 400` dan properti `field = 'document'` jika tipe izin diubah ke 'SAKIT' tanpa melampirkan berkas dokter.
 */
export const updatePermit = async ({ id, body, file, currentUser }) => {
  const { type, date, reason } = body;

  const permit = await Permit.findOne({ _id: id, employeeId: currentUser.employeeId });

  if (!permit) {
    const error = new Error("Data pengajuan perizinan tidak ditemukan.");
    error.statusCode = 404;
    throw error;
  }

  if (permit.status !== "PENDING") {
    const error = new Error("Akses Ditolak: Berkas telah diproses oleh atasan.");
    error.statusCode = 400;
    throw error;
  }

  if (type === "SAKIT" && !file && !permit.document) {
    const error = new Error("Izin sakit wajib menyertakan dokumen surat keterangan dokter.");
    error.statusCode = 400;
    error.field = "document";
    throw error;
  }

  if (file) {
    if (permit.document) {
      const oldPath = `./public${permit.document}`;
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.error("Gagal hapus file lama:", e);
        }
      }
    }
    permit.document = `/uploads/files/${file.filename}`;
  }

  permit.type = type;
  permit.date = date;
  permit.reason = reason;

  await permit.save();
  return permit;
};

/**
 * Menghapus/menarik berkas dokumen perizinan dari sisi karyawan dengan mengubah statusnya menjadi `CANCELLED`.
 * Dokumen tidak benar-benar dihapus (hard delete) dari database demi kebutuhan audit trail.
 * * @async
 * @function deletePermit
 * @param {Object} payload - Objek parameter fungsi.
 * @param {string} payload.id - ID dokumen perizinan (`_id`) yang akan dibatalkan.
 * @param {string} payload.employeeId - ID pegawai dari pemohon untuk mencocokkan hak akses pembatalan berkas.
 * @returns {Promise<boolean>} Mengembalikan nilai `true` jika proses pembatalan status berhasil dilakukan.
 * * @throws {Error} Melempar error dengan `statusCode = 404` jika berkas tidak ditemukan.
 * @throws {Error} Melempar error dengan `statusCode = 400` jika dokumen tidak berstatus `PENDING` (sudah diproses oleh pihak atasan).
 */
export const deletePermit = async ({ id, employeeId }) => {
  const permit = await Permit.findOne({ _id: id, employeeId });

  if (!permit) {
    const error = new Error("Data pengajuan perizinan tidak ditemukan.");
    error.statusCode = 404;
    throw error;
  }

  if (permit.status !== "PENDING") {
    const error = new Error("Akses Ditolak: Dokumen telah dikunci karena sudah diproses.");
    error.statusCode = 400;
    throw error;
  }

  permit.status = "CANCELLED";
  await permit.save();

  return true;
};
