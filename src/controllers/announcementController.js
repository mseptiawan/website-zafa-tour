import Announcement from "../models/Announcement.js";

export const newForm = (req, res) => {
  res.render("announcement/create", {
    title: "Buat Pengumuman",
    user: req.session.user,
  });
};

export const create = async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || title.trim().length < 5) {
      return res.status(400).send("Judul minimal 5 karakter");
    }

    if (!content || content.trim().length < 10) {
      return res.status(400).send("Isi pengumuman terlalu pendek");
    }

    let status = "PUBLISHED";

    if (category === "OFFICIAL") {
      status = "DRAFT";
    }

    await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      category,
      status,
      createdBy: req.session.user._id,

      attachment: req.file ? req.file.filename : null,
    });

    return res.redirect("/announcement");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Create announcement error");
  }
};

export const index = async (req, res) => {
  try {
    const announcements = await Announcement.find().populate("createdBy").sort({ createdAt: -1 });

    res.render("announcement/all", {
      title: "Semua Pengumuman",
      announcements,
      user: req.session.user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
};

export const show = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate("createdBy");

    res.render("announcement/detail", {
      title: "Detail Pengumuman",
      announcement,
      user: req.session.user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
};

export const publish = async (req, res) => {
  try {
    await Announcement.findByIdAndUpdate(req.params.id, {
      status: "PUBLISHED",
    });

    return res.redirect("/announcement");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Publish error");
  }
};
