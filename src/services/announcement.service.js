import Announcement from "../models/Announcement.js";

const create = async (req) => {
  const { title, content, category } = req.body;

  if (!title || title.trim().length < 5) {
    throw new Error("Judul minimal 5 karakter");
  }

  if (!content || content.trim().length < 10) {
    throw new Error("Isi pengumuman terlalu pendek");
  }

  let status = "PUBLISHED";
  if (category === "OFFICIAL") status = "DRAFT";

  return Announcement.create({
    title: title.trim(),
    content: content.trim(),
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
