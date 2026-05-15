import SalesVisit from "../models/SalesVisit.js";
import {
  createSalesVisitSchema,
  updateSalesVisitSchema,
} from "../validations/sales-visit/sales.validation.js";
import { validate } from "../middlewares/validate.js";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/* ---------------- CREATE ---------------- */
const create = async ({ body, files, userId }) => {
  // ✔ ZOD VALIDATION (single source of truth)
  const data = validate(createSalesVisitSchema, body);

  const attachments = (files || []).map((file) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error("Format file tidak valid (JPG, PNG, WEBP, PDF)");
    }

    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/files/${file.filename}`,
    };
  });

  return SalesVisit.create({
    userId,
    ...data,
    attachments,
    visitTime: new Date(),
  });
};

/* ---------------- FIND ---------------- */
const findMine = (userId) => SalesVisit.find({ userId }).sort({ createdAt: -1 });

const findAll = () => SalesVisit.find().populate("userId").sort({ createdAt: -1 });

const findById = (id) => SalesVisit.findById(id).populate("userId");

/* ---------------- UPDATE ---------------- */
const update = async ({ id, userId, body, files }) => {
  const visit = await SalesVisit.findById(id);

  if (!visit) {
    throw new Error("Data tidak ditemukan");
  }

  // ✔ OWNERSHIP CHECK
  if (visit.userId.toString() !== userId) {
    throw new Error("Tidak boleh mengedit data ini");
  }

  // ⛔ 24 HOURS LOCK RULE
  const diffHours = (Date.now() - new Date(visit.createdAt).getTime()) / (1000 * 60 * 60);

  if (diffHours > 24) {
    throw new Error("Data tidak bisa diedit setelah 24 jam");
  }

  // ✔ ZOD VALIDATION
  const data = validate(updateSalesVisitSchema, body);

  // ✔ FILE HANDLING
  let attachments = visit.attachments || [];

  if (files && files.length > 0) {
    attachments = files.map((file) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error("Format file tidak valid");
      }

      return {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: `/uploads/files/${file.filename}`,
      };
    });
  }

  // ✔ APPLY UPDATE
  Object.assign(visit, data);
  visit.attachments = attachments;

  return visit.save();
};

export default {
  create,
  update,
  findMine,
  findAll,
  findById,
};
