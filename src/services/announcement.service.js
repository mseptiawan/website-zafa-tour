import Announcement from "../models/Announcement.js";
import { getPaginationMeta } from "../utils/pagination.js";
import { createAnnouncementSchema } from "../validations/announcementValidator.js";
const create = async (req) => {
  const parsed = createAnnouncementSchema.safeParse(req.body);

  if (!parsed.success) {
    const fieldErrors = {};
    parsed.error.errors.forEach((err) => {
      const path = err.path[0];
      if (!fieldErrors[path]) {
        fieldErrors[path] = err.message;
      }
    });

    const error = new Error("Validasi gagal");
    error.statusCode = 400;
    error.fields = fieldErrors;
    throw error;
  }

  const { title, content, category } = parsed.data;

  let status = "PUBLISHED";
  if (category === "OFFICIAL") status = "DRAFT";

  return Announcement.create({
    title,
    content,
    category,
    status,
    createdBy: req.session.user._id,
    attachment: req.file ? req.file.filename : null,
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

  const meta = getPaginationMeta({ page, limit, total });

  return { data, meta };
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
