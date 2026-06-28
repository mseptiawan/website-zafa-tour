import path from "path";
import ejs from "ejs";
import puppeteer from "puppeteer";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import SalesVisit from "../models/SalesVisit.model.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.js";
import Bidang from "../models/basic/Bidang.model.js";
import Employee from "../models/employee/Employee.model.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/**
 * Mencatat data kunjungan sales baru ke dalam database beserta lampirannya.
 * @param {Object} params
 * @param {Object} params.body - Payload data form kunjungan
 * @param {Object} [params.file] - File object unggahan dari multer
 * @param {string} params.userId - ID User penginput
 * @returns {Promise<Object>} Instance data SalesVisit terbuat
 * @throws {Error} Jika format file tidak diizinkan
 */
export const createSalesVisit = async ({ body, file, userId }) => {
  let attachments = [];

  if (file) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error("Format file tidak valid. Hanya menerima JPG, PNG, WEBP, atau PDF.");
    }

    attachments = [
      {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: `/uploads/files/${file.filename}`,
      },
    ];
  }

  return await SalesVisit.create({
    userId,
    ...body,
    attachments,
    visitTime: new Date(),
  });
};

/**
 * Mengambil data riwayat kunjungan milik sales pribadi (Terpaginasi & Lean).
 * @param {Object} params
 * @param {string} params.userId - ID User aktif dari session
 * @param {number|string} params.page - Halaman aktif saat ini
 * @param {number} params.limit - Limit jumlah item per halaman
 * @returns {Promise<{data: Array<Object>, meta: Object}>} Hasil data dan metadata paginasi
 */
export const findMinePaged = async ({ userId, page, limit }) => {
  const { skip, page: currentPage, limit: perPage } = getPagination({ page, limit });
  const queryFilter = { userId };

  const [data, total] = await Promise.all([
    SalesVisit.find(queryFilter).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
    SalesVisit.countDocuments(queryFilter),
  ]);

  return { data, meta: getPaginationMeta({ page: currentPage, limit: perPage, total }) };
};

/**
 * Mengambil satu detail data kunjungan sales berdasarkan ID.
 * @param {string} id - ID Object data SalesVisit
 * @returns {Promise<Object|null>} Berkas kunjungan utuh yang di-populate
 */
export const findById = async (id) => {
  return await SalesVisit.findById(id).populate("userId");
};

/**
 * Mengubah data riwayat kunjungan yang telah dibuat dengan batasan waktu sunting maksimal 24 jam.
 * @param {Object} params
 * @param {string} params.id - ID dokumen kunjungan sales
 * @param {string} params.userId - ID User pengedit untuk validasi hak kepemilikan
 * @param {Object} params.body - Payload data pembaruan form
 * @param {Object} [params.file] - Berkas lampiran baru pengganti
 * @returns {Promise<Object>} Dokumen SalesVisit yang berhasil diperbarui
 * @throws {Error} Jika dokumen tidak ditemukan, hak akses ditolak, atau melewati batas 24 jam
 */
export const updateSalesVisit = async ({ id, userId, body, file }) => {
  const visit = await SalesVisit.findById(id);

  if (!visit) {
    throw new Error("Data kunjungan tidak ditemukan.");
  }

  if (visit.userId.toString() !== userId.toString()) {
    throw new Error("Anda tidak memiliki hak akses untuk mengubah dokumen ini.");
  }

  const diffHours = (Date.now() - new Date(visit.createdAt).getTime()) / (1000 * 60 * 60);
  if (diffHours > 24) {
    throw new Error("Batas waktu penyuntingan habis. Data tidak bisa diubah setelah 24 jam.");
  }

  let attachments = visit.attachments || [];

  if (file) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error("Format file tidak valid. Hanya menerima JPG, PNG, WEBP, atau PDF.");
    }

    attachments = [
      {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: `/uploads/files/${file.filename}`,
      },
    ];
  }

  Object.assign(visit, body);
  visit.attachments = attachments;

  return await visit.save();
};

/**
 * Mengambil seluruh data kunjungan milik sales tertentu tanpa paginasi (Untuk kebutuhan ekspor).
 * @param {string} userId - ID User sales terkait
 * @returns {Promise<Array<Object>>} Daftar array dokumen POJO murni
 */
export const findMineRaw = async (userId) => {
  return await SalesVisit.find({ userId }).sort({ createdAt: -1 }).lean();
};

/**
 * Memonitoring seluruh data kunjungan sales yang disaring berdasarkan kesamaan bidang kerja.
 * @param {Object} params
 * @param {number|string} params.page - Nomor halaman aktif
 * @param {number} params.limit - Limit baris data per halaman
 * @param {string} params.userBidangId - Bidang ID milik manager yang didapat dari session user
 * @param {boolean} params.isWadirOrDirektur - Flag hak akses penuh direksi tanpa batas bidang
 * @returns {Promise<{data: Array<Object>, meta: Object}>} Data monitoring terpaginasi lengkap dengan populate profile
 */
export const findAllPaged = async ({ page, limit, userBidangId, isWadirOrDirektur }) => {
  const { skip, page: currentPage, limit: perPage } = getPagination({ page, limit });
  let queryFilter = {};

  if (!isWadirOrDirektur) {
    if (userBidangId) {
      const careers = await EmployeeCareer.find({ bidangId: userBidangId })
        .select("employee_id")
        .lean();

      const employeeIds = careers.map((c) => c.employee_id);

      const employees = await Employee.find({ _id: { $in: employeeIds } })
        .select("userId")
        .lean();

      const userIdsUnderManager = employees.map((e) => e.userId);

      queryFilter = { userId: { $in: userIdsUnderManager } };
    } else {
      queryFilter = { userId: null };
    }
  }

  const [data, total] = await Promise.all([
    SalesVisit.find(queryFilter)
      .populate({
        path: "userId",
        select: "username",
        populate: {
          path: "employeeData",
          select: "fullName foto_profile",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .lean(),
    SalesVisit.countDocuments(queryFilter),
  ]);

  return { data, meta: getPaginationMeta({ page: currentPage, limit: perPage, total }) };
};

/**
 * Mengonversi template EJS data kunjungan sales menjadi bentuk buffer berkas PDF siap unduh.
 * @param {Object} user - Objek data informasi user pengekspor dari session
 * @param {Array<Object>} visits - Array log data kunjungan sales terkait
 * @returns {Promise<Buffer>} Berkas PDF murni dalam format buffer
 */
export const generateSalesVisitPdf = async (user, visits) => {
  const templatePath = path.resolve("src/views/pdf/sales-visit.ejs");
  const htmlContent = await ejs.renderFile(templatePath, {
    user,
    visits,
    formattedDate: new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        bottom: "15mm",
        left: "15mm",
        right: "15mm",
      },
    });
  } finally {
    await browser.close();
  }
};
