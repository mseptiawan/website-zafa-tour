import Announcement from "../models/Announcement.model.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";

// ─── SERVICE: CREATE DATA ────────────────────────────────────────────────────
export const createAnnouncementService = async ({ body, userSession, file }) => {
  const { title, content, category } = body;

  return await Announcement.create({
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

// ─── SERVICE: GET ALL (PAGINATED) ────────────────────────────────────────────
export const getAllAnnouncementsService = async ({ page, isMobile }) => {
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
    Announcement.find()
      .populate({
        path: "createdBy",
        select: "username",
        populate: { path: "employeeData", select: "fullName foto_profile" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

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

// ─── SERVICE: GET BY ID ──────────────────────────────────────────────────────
export const getAnnouncementByIdService = async (id) => {
  return await Announcement.findById(id)
    .populate({
      path: "createdBy",
      select: "username",
      populate: { path: "employeeData", select: "fullName foto_profile" },
    })
    .lean();
};
