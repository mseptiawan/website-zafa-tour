import announcementService from "../services/announcement.service.js";

export const newForm = (req, res) => {
  res.render("announcement/create", {
    title: "Buat Pengumuman",
    user: req.session.user,
  });
};

export const create = async (req, res, next) => {
  try {
    await announcementService.create(req);
    return res.redirect("/announcement");
  } catch (err) {
    next(err);
  }
};

export const index = async (req, res, next) => {
  try {
    const announcements = await announcementService.getAll();

    res.render("announcement/all", {
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

    res.render("announcement/detail", {
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
