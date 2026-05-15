import announcementService from "../services/announcement.service.js";

export const newForm = (req, res) => {
  res.render("announcement/create", {
    title: "Buat Pengumuman",
    user: req.session.user,
    error: null,
    old: {},
  });
};

export const create = async (req, res, next) => {
  try {
    await announcementService.create(req);
    return res.redirect("/announcement");
  } catch (err) {
    return res.status(400).render("announcement/create", {
      title: "Buat Pengumuman",
      user: req.session.user,
      error: err.message,
      old: req.body,
    });
  }
};

export const index = async (req, res, next) => {
  try {
    const announcements = await announcementService.getAll();

    res.render("announcement/index", {
      title: "Semua Pengumuman",
      announcements,
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};

export const show = async (req, res, next) => {
  try {
    const announcement = await announcementService.getById(req.params.id);

    res.render("announcement/show", {
      title: "Detail Pengumuman",
      announcement,
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};

export const publish = async (req, res, next) => {
  try {
    await announcementService.publish(req.params.id);
    return res.redirect("/announcement");
  } catch (err) {
    next(err);
  }
};
