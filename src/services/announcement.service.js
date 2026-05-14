import Announcement from "../models/Announcement.js";
import { createAnnouncementSchema } from "../validations/announcement/announcement.schema.js";

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

const getAll = () => {
  return Announcement.find().populate("createdBy").sort({ createdAt: -1 });
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
