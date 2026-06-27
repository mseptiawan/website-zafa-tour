import Announcement from "../models/Announcement.model.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";

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
const getAll = async ({ page, isMobile }) => {
  const determinedLimit = isMobile ? 5 : 9;

  const {
    page: currentPage,
    limit,
    skip,
  } = getPagination({
    page,
    limit: determinedLimit,
  });

  const [data, total] = await Promise.all([
    Announcement.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),

    Announcement.countDocuments(),
  ]);

  return {
    data,
    meta: getPaginationMeta({
      page: currentPage,
      limit,
      total,
    }),
  };
};

// ─── GET BY ID ───────────────────────────────────────────────────────────────
const getById = (id) => {
  return Announcement.findById(id).lean();
};

export default { create, getAll, getById };
