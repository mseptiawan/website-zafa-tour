import { getPaginationMeta } from "../utils/pagination.js";
import SalesVisit from "../models/SalesVisit.model.js";
import { createSalesVisitSchema, updateSalesVisitSchema } from "../validations/sales.schema.js";
import { validateData } from "../utils/validateData.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.js";
import Bidang from "../models/basic/Bidang.model.js";
import Employee from "../models/employee/Employee.model.js";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const create = async ({ body, file, userId }) => {
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
    ...body,
    attachments,
    visitTime: new Date(),
  });
};

export const findMinePaged = async ({ userId, page, limit, skip }) => {
  const queryFilter = { userId: userId };
  const [data, total] = await Promise.all([
    SalesVisit.find(queryFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    SalesVisit.countDocuments(queryFilter),
  ]);
  return { data, meta: getPaginationMeta({ page, limit, total }) };
};

const findAll = () => SalesVisit.find().populate("userId").sort({ createdAt: -1 });

const findById = (id) => SalesVisit.findById(id).populate("userId");

const update = async ({ id, userId, body, file }) => {
  // Diubah dari files ke file agar sesuai dengan single upload
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

  let attachments = visit.attachments || [];

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

  Object.assign(visit, body);
  visit.attachments = attachments;

  return visit.save();
};

const findMine = (userId) => {
  return SalesVisit.find({ userId }).sort({ createdAt: -1 }).lean();
};

const findAllPaged = async ({ page, limit, skip, managerRoleId, isWadirOrDirektur }) => {
  let queryFilter = {};

  if (!isWadirOrDirektur && managerRoleId) {
    const bidang = await Bidang.findOne({ managerRoleId });

    if (bidang) {
      const careers = await EmployeeCareer.find({ bidangId: bidang._id })
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
      .limit(limit)
      .lean(),
    SalesVisit.countDocuments(queryFilter),
  ]);

  return { data, meta: getPaginationMeta({ page, limit, total }) };
};
export default {
  create,
  update,
  findMine,
  findMinePaged,
  findAll,
  findById,
  findAllPaged,
};
