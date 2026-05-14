import announcementService from "../services/announcement.service.js";

export const newForm = (req, res) => {
  res.render("announcement/create", {
    title: "Buat Pengumuman",
    user: req.session.user,
  });
};

export const create = async (req, res) => {
  try {
    await announcementService.create(req);
    return res.redirect("/announcement");
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

export const index = async (req, res) => {
  try {
    const announcements = await announcementService.getAll();

    res.render("announcement/all", {
      title: "Semua Pengumuman",
      announcements,
      user: req.session.user,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

export const show = async (req, res) => {
  try {
    const announcement = await announcementService.getById(req.params.id);

    res.render("announcement/detail", {
      title: "Detail Pengumuman",
      announcement,
      user: req.session.user,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

export const publish = async (req, res) => {
  try {
    await announcementService.publish(req.params.id);
    return res.redirect("/announcement");
  } catch (err) {
    return res.status(500).send(err.message);
  }
};
