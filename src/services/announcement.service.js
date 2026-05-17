import Announcement from "../models/Announcement.js";
import { createAnnouncementSchema } from "../validations/announcement/announcement.schema.js";
import { getPaginationMeta } from "../utils/pagination.js";
const create = async (req) => {
  const parsed = createAnnouncementSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(parsed.error.errors[0].message, 400);
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
    Announcement.find().populate("createdBy").sort({ createdAt: -1 }).skip(skip).limit(limit),

    Announcement.countDocuments(),
  ]);

  const meta = getPaginationMeta({ page, limit, total });

  return { data, meta };
};

const getById = (id) => {
  return Announcement.findById(id).populate("createdBy");
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
