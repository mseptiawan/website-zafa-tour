import Announcement from "../models/Announcement.model.js";
import { getPaginationMeta } from "../utils/pagination.js";

const POPULATE_CREATED_BY = {
  path: "createdBy",
  select: "username",
  populate: {
    path: "employeeData",
    select: "fullName foto_profile",
  },
};

// ─── CREATE ──────────────────────────────────────────────────────────────────
const create = ({ body, userId, file }) => {
  const { title, content, category } = body;

  const status = category === "OFFICIAL" ? "DRAFT" : "PUBLISHED";

  return Announcement.create({
    title,
    content,
    category,
    createdBy: userId,
    attachment: file?.filename || null,
    publishDate: new Date(),
  });
};

// ─── GET ALL ─────────────────────────────────────────────────────────────────
const getAll = async ({ page, limit, skip }) => {
  const [data, total] = await Promise.all([
    Announcement.find()
      .populate(POPULATE_CREATED_BY)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Announcement.countDocuments(),
  ]);

  return {
    data,
    meta: getPaginationMeta({ page, limit, total }),
  };
};

// ─── GET BY ID ───────────────────────────────────────────────────────────────
const getById = (id) => {
  return Announcement.findById(id).populate(POPULATE_CREATED_BY).lean();
};

export default { create, getAll, getById };
