import Announcement from "../models/Announcement.js";
import { getPaginationMeta } from "../utils/pagination.js";

const ANNOUNCEMENT_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
};

const ANNOUNCEMENT_CATEGORY = {
  OFFICIAL: "OFFICIAL",
};

const create = async ({ body, userId, file }) => {
  const { title, content, category } = body;

  let status = ANNOUNCEMENT_STATUS.PUBLISHED;

  if (category === ANNOUNCEMENT_CATEGORY.OFFICIAL) {
    status = ANNOUNCEMENT_STATUS.DRAFT;
  }

  return Announcement.create({
    title,
    content,
    category,
    status,
    createdBy: userId,
    attachment: file?.filename || null,
  });
};

const getAll = async ({ page, limit, skip }) => {
  const [data, total] = await Promise.all([
    Announcement.find()
      .populate({
        path: "createdBy",
        select: "_id",
        populate: {
          path: "employeeData",
          select: "fullName",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Announcement.countDocuments(),
  ]);

  const meta = getPaginationMeta({
    page,
    limit,
    total,
  });

  return {
    data,
    meta,
  };
};

const getById = (id) => {
  return Announcement.findById(id).populate({
    path: "createdBy",
    select: "_id",
    populate: {
      path: "employeeData",
      select: "fullName",
    },
  });
};

const publish = (id) => {
  return Announcement.findByIdAndUpdate(id, {
    status: "PUBLISHED",
  });
};

export default {
  create,
  getAll,
  getById,
  publish,
};
