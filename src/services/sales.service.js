import path from "path";
import ejs from "ejs";
import puppeteer from "puppeteer";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import SalesVisit from "../models/SalesVisit.model.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export const createSalesVisit = async ({ body, file, employeeId }) => {
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
    employeeId,
    ...body,
    attachments,
    visitTime: new Date(),
  });
};

export const findMinePaged = async ({ employeeId, page, limit }) => {
  const { skip, page: currentPage, limit: perPage } = getPagination({ page, limit });
  const queryFilter = { employeeId };

  const [data, total] = await Promise.all([
    SalesVisit.find(queryFilter).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean(),
    SalesVisit.countDocuments(queryFilter),
  ]);

  return { data, meta: getPaginationMeta({ page: currentPage, limit: perPage, total }) };
};

export const findById = async (id) => {
  return await SalesVisit.findById(id).populate("employeeId");
};

export const updateSalesVisit = async ({ id, employeeId, body, file }) => {
  const visit = await SalesVisit.findById(id);

  if (!visit) throw new Error("Data kunjungan tidak ditemukan.");

  if (visit.employeeId.toString() !== employeeId.toString()) {
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

export const findMineRaw = async (employeeId) => {
  return await SalesVisit.find({ employeeId }).sort({ createdAt: -1 }).lean();
};

export const findAllPaged = async ({ page, limit, userBidangId, isWadirOrDirektur }) => {
  const { skip, page: currentPage, limit: perPage } = getPagination({ page, limit });
  let queryFilter = {};

  if (!isWadirOrDirektur) {
    if (userBidangId) {
      const careers = await EmployeeCareer.find({ bidangId: userBidangId })
        .select("employee_id")
        .lean();

      const employeeIdsUnderManager = careers.map((c) => c.employee_id);

      queryFilter = { employeeId: { $in: employeeIdsUnderManager } };
    } else {
      queryFilter = { employeeId: null };
    }
  }

  const [data, total] = await Promise.all([
    SalesVisit.find(queryFilter)
      .populate({
        path: "employeeId",
        select: "fullName foto_profile",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .lean(),
    SalesVisit.countDocuments(queryFilter),
  ]);

  return { data, meta: getPaginationMeta({ page: currentPage, limit: perPage, total }) };
};

export const generateSalesVisitPdf = async (sessionUser, visits) => {
  const templatePath = path.resolve("src/views/pdf/sales-visit.ejs");
  const htmlContent = await ejs.renderFile(templatePath, {
    user: sessionUser,
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
      margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" },
    });
  } finally {
    await browser.close();
  }
};
