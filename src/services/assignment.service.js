import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import { ROLES, PAGINATION, FILE_UPLOAD, MODULES, NOTIF_CATEGORIES } from "../config/constants.js";
import Assignment from "../models/Assignment.model.js";
import Employee from "../models/employee/Employee.model.js";
import User from "../models/basic/User.model.js";

import notificationService from "./notification.service.js";

/**
 * Query builder internal untuk menyaring data penugasan berdasarkan role user.
 * (Fungsi internal/private tetap menggunakan nama camelCase singkat)
 */
const buildAssignmentFilter = (currentUser) => {
  const filter = {};
  const role = currentUser?.role?.toUpperCase();

  const restrictedRoles = [
    ROLES.MANAGER_ADMINISTRASI,
    ROLES.MANAGER_HAJI_UMRAH,
    ROLES.MANAGER_KEUANGAN,
  ];

  if (restrictedRoles.includes(role)) {
    filter.createdBy = currentUser._id;
  }
  return filter;
};

/**
 * Memvalidasi berkas/dokumen lampiran secara ketat sebelum diproses sistem.
 */
const validateUploadedFile = (file) => {
  if (!file) return;

  if (file.size > FILE_UPLOAD.MAX_SIZE) {
    const err = new Error("Ukuran file lampiran terlalu besar. Maksimal berukuran 5MB.");
    err.statusCode = 400;
    throw err;
  }

  if (!FILE_UPLOAD.ALLOWED_MIMETYPES.includes(file.mimetype)) {
    const err = new Error("Format file tidak didukung. Unggah file gambar, PDF, atau Word.");
    err.statusCode = 400;
    throw err;
  }
};

/**
 * Mengambil semua daftar karyawan aktif untuk pilihan drop-down formulir (Optimal via .lean()).
 * @param {string|null} [excludeEmployeeId=null] - ID Karyawan pembuat untuk dikecualikan
 * @returns {Promise<Array<Object>>} Daftar karyawan murni (POJO)
 */
export const getEmployeesForAssignment = async (excludeEmployeeId = null) => {
  const query = {};
  if (excludeEmployeeId) {
    query._id = { $ne: excludeEmployeeId };
  }
  return await Employee.find(query).sort({ fullName: 1 }).lean();
};

/**
 * Membuat data penugasan baru sekaligus mengirimkan notifikasi push ke tim yang didelegasikan.
 * @param {Object} params
 * @param {Object} params.body - Request body berisi payload form
 * @param {Object} [params.file] - Berkas lampiran multer
 * @param {string} params.userId - ID User pembuat dokumen
 * @param {string} params.creatorName - Nama lengkap user pembuat dokumen
 * @returns {Promise<Object>} Instance data Assignment terbuat
 */
export const createAssignment = async ({ body, file, userId, creatorName }) => {
  validateUploadedFile(file);

  let employeeIds = [];
  if (body.employees) {
    employeeIds = Array.isArray(body.employees) ? body.employees : [body.employees];
  }

  const assignment = await Assignment.create({
    title: body.title,
    description: body.description,
    type: body.type,
    location: body.location,
    startDate: body.startDate,
    endDate: body.endDate,
    employees: employeeIds,
    createdBy: userId,
    attachment: file?.filename || null,
  });

  if (employeeIds.length > 0 && employeeIds[0]) {
    try {
      const employeesData = await Employee.find({ _id: { $in: employeeIds } })
        .select("userId")
        .lean();

      const targetUserIds = employeesData.map((emp) => emp.userId).filter((id) => id != null);

      if (targetUserIds.length > 0) {
        await notificationService.createManyNotifications({
          userIds: targetUserIds,
          senderId: userId,
          senderName: creatorName || "Pimpinan",
          title: "Penugasan Baru",
          text: `Anda mendapatkan penugasan baru: "${body.title || "Tanpa Judul"}"`,
          module: MODULES.ASSIGNMENT,
          referenceId: assignment._id,
          actionUrl: `/assignments/${assignment._id}`,
          type: "ASSIGNMENT",
          category: NOTIF_CATEGORIES.INFO,
        });
      }
    } catch (notifError) {
      console.error("ERROR DI DALAM BLOK NOTIFIKASI:", notifError.message);
    }
  }

  return assignment;
};

/**
 * Mengambil data penugasan yang didelegasikan spesifik ke karyawan tertentu (Terpagination & Lean).
 * @param {Object} params
 * @param {string} params.employeeId - ID Karyawan login aktif
 * @param {number|string} [params.page] - Posisi halaman saat ini
 * @param {number|string} [params.limit] - Limit data per halaman
 * @returns {Promise<{data: Array<Object>, meta: Object}>} Objek standar pembawa data & metadata halaman
 */
export const getAssignmentsByEmployeeId = async ({ employeeId, page, limit }) => {
  if (!employeeId) {
    return {
      data: [],
      meta: getPaginationMeta({ page: 1, limit: PAGINATION.DEFAULT_LIMIT, total: 0 }),
    };
  }

  const paginationArgs = getPagination({ page, limit });
  const filter = { employees: employeeId };
  const total = await Assignment.countDocuments(filter);

  const data = await Assignment.find(filter)
    .populate("createdBy", "username email")
    .sort({ createdAt: -1 })
    .skip(paginationArgs.skip)
    .limit(paginationArgs.limit)
    .lean();

  return {
    data,
    meta: getPaginationMeta({
      page: paginationArgs.page,
      limit: paginationArgs.limit,
      total,
    }),
  };
};

/**
 * Mengambil seluruh log data penugasan internal perusahaan berdasarkan hak akses user (Terpagination & Lean).
 * @param {Object} params
 * @param {number|string} [params.page=1] - Posisi halaman saat ini
 * @param {number|string} [params.limit] - Jumlah limit item per halaman
 * @param {Object} params.currentUser - Objek Sesi User login aktif
 * @returns {Promise<{data: Array<Object>, meta: Object}>} Objek standar pembawa data & metadata halaman
 */
export const getAllAssignments = async ({ page = 1, limit = PAGINATION.ASSIGNMENT_DEFAULT, currentUser }) => {
  const paginationArgs = getPagination({ page, limit });
  const filter = buildAssignmentFilter(currentUser);
  const total = await Assignment.countDocuments(filter);

  const data = await Assignment.find(filter)
    .populate([{ path: "employees" }, { path: "createdBy" }])
    .sort({ createdAt: -1 })
    .skip(paginationArgs.skip)
    .limit(paginationArgs.limit)
    .lean();

  return {
    data,
    meta: getPaginationMeta({
      page: paginationArgs.page,
      limit: paginationArgs.limit,
      total,
    }),
  };
};

/**
 * Mencari satu detail dokumen penugasan secara mendalam melalui ID dokumen (Lean).
 * @param {string} id - ID Object Data Assignment
 * @returns {Promise<Object|null>} Berkas penugasan utuh atau null
 */
export const getAssignmentById = async (id) => {
  return await Assignment.findById(id)
    .populate([
      { path: "employees" },
      {
        path: "createdBy",
        select: "username email",
        populate: {
          path: "employeeData",
          select: "fullName foto_profile",
        },
      },
    ])
    .lean();
};