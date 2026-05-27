import SalesVisit from "../models/SalesVisit.js";
import { createSalesVisitSchema, updateSalesVisitSchema } from "../validations/sales.schema.js";
import { validateData } from "../utils/validateData.js";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const create = async ({ body, file, userId }) => {
  const data = validateData(createSalesVisitSchema, body);

  let attachments = [];

  if (file) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error("Format file tidak valid (JPG, PNG, WEBP, PDF)");
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

  return SalesVisit.create({
    userId,
    ...data,
    attachments,
    visitTime: new Date(),
  });
};

const findMine = (userId) => SalesVisit.find({ userId }).sort({ createdAt: -1 });

const findAll = () => SalesVisit.find().populate("userId").sort({ createdAt: -1 });

const findById = (id) => SalesVisit.findById(id).populate("userId");

const update = async ({ id, userId, body, files }) => {
  const visit = await SalesVisit.findById(id);

  if (!visit) {
    throw new Error("Data tidak ditemukan");
  }

  if (visit.userId.toString() !== userId) {
    throw new Error("Tidak boleh mengedit data ini");
  }

  const diffHours = (Date.now() - new Date(visit.createdAt).getTime()) / (1000 * 60 * 60);

  if (diffHours > 24) {
    throw new Error("Data tidak bisa diedit setelah 24 jam");
  }

  const data = validateData(updateSalesVisitSchema, body);

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
