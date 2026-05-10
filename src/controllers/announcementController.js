import Announcement from "../models/Announcement.js";

/* =================================
   FORM CREATE
================================= */
export const formAnnouncement = (req, res) => {
  res.render("announcement/create", {
    title: "Buat Pengumuman",
  });
};

/* =================================
   CREATE ANNOUNCEMENT
================================= */
export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, category, isPinned } = req.body;

    // =========================
    // OFFICIAL = wajib surat
    // =========================
    if (category === "OFFICIAL" && !req.file) {
      return res.send("Pengumuman resmi wajib upload surat");
    }

    // =========================
    // STATUS LOGIC
    // =========================
    let status = "PUBLISHED";

    if (category === "OFFICIAL") {
      status = "DRAFT";
    }

    await Announcement.create({
      title,
      content,
      category,
      status,

      createdBy: req.session.user._id,

      isPinned: isPinned === "on",

      attachment: req.file ? req.file.filename : null,
    });

    res.redirect("/announcement/all");
  } catch (err) {
    console.log(err);
    res.status(500).send("Create announcement error");
  }
};

/* =================================
   ALL ANNOUNCEMENT
================================= */
export const allAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().populate("createdBy").sort({
      isPinned: -1,
      createdAt: -1,
    });

    res.render("announcement/all", {
      title: "Semua Pengumuman",
      announcements,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
};

/* =================================
   DETAIL
================================= */
export const detailAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate(
      "createdBy",
    );

    res.render("announcement/detail", {
      title: "Detail Pengumuman",
      announcement,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
};

/* =================================
   PUBLISH OFFICIAL ANNOUNCEMENT
================================= */
export const publishAnnouncement = async (req, res) => {
  try {
    await Announcement.findByIdAndUpdate(req.params.id, {
      status: "PUBLISHED",
    });

    res.redirect("/announcement/all");
  } catch (err) {
    console.log(err);
    res.status(500).send("Publish error");
  }
};
