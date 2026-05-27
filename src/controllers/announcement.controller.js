import { getPagination } from "../utils/pagination.js";
import announcementService from "../services/announcement.service.js";
import { createAnnouncementSchema } from "../validations/announcement.schema..js";
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
    const validatedBody = createAnnouncementSchema.parse(req.body);

    await announcementService.create({
      body: validatedBody,
      userId: req.session.user._id,
      file: req.file,
    });

    return res.redirect("/announcement");
  } catch (err) {
    if (err.errors) {
      return res.status(400).render("announcement/create", {
        title: "Buat Pengumuman",
        user: req.session.user,
        error: null,
        errors: err.flatten().fieldErrors,
        old: req.body,
      });
    }

    return next(err);
  }
};

export const index = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination({
      page: req.query.page,
      limit: 9,
    });

    const result = await announcementService.getAll({
      page,
      limit,
      skip,
    });

    res.render("announcement/index", {
      title: "Semua Pengumuman",
      announcements: result.data,
      pagination: result.meta,
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
