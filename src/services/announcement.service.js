import Announcement from "../models/Announcement.model.js";
import { getPaginationMeta } from "../utils/pagination.js";

// ─── CREATE ──────────────────────────────────────────────────────────────────
const create = ({ body, userSession, file }) => {
  const { title, content, category } = body;

  return Announcement.create({
    title,
    content,
    category,
    createdBy: userSession._id,
    authorName: userSession.fullName,
    authorAvatar: userSession.foto_profile,
    attachment: file?.filename || null,
    publishDate: new Date(),
  });
};

// ─── GET ALL ─────────────────────────────────────────────────────────────────
const getAll = async ({ page, limit, skip }) => {
  const [data, total] = await Promise.all([
    Announcement.find()

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
  return Announcement.findById(id).lean();
};

export default { create, getAll, getById };
