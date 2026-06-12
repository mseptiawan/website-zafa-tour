import { getPagination } from "../utils/pagination.js";
import announcementService from "../services/announcement.service.js";

const RENDER_DEFAULTS = (req) => ({
  user: req.session.user,
});

// ─── NEW FORM ─────────────────────────────────────────────────────────────────
export const newForm = (req, res) => {
  res.render("announcement/create", {
    ...RENDER_DEFAULTS(req),
    title: "Buat Pengumuman",
    old: {},
    errors: {},
  });
};

// ─── CREATE ───────────────────────────────────────────────────────────────────

export const create = async (req, res, next) => {
  try {
    if (req.validationErrors) {
      return res.status(400).render("announcement/create", {
        ...RENDER_DEFAULTS(req),
        title: "Buat Pengumuman",
        errors: req.validationErrors,
        old: req.body,
      });
    }

    await announcementService.create({
      body: req.body,
      userId: req.session.user._id,
      file: req.file,
    });

    return res.redirect("/announcement");
  } catch (err) {
    next(err);
  }
};

// ─── INDEX ────────────────────────────────────────────────────────────────────
export const index = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination({ page: req.query.page, limit: 9 });

    const result = await announcementService.getAll({ page, limit, skip });

    res.render("announcement/index", {
      ...RENDER_DEFAULTS(req),
      title: "Semua Pengumuman",
      announcements: result.data,
      pagination: result.meta,
    });
  } catch (err) {
    next(err);
  }
};

// ─── SHOW ─────────────────────────────────────────────────────────────────────
export const show = async (req, res, next) => {
  try {
    const announcement = await announcementService.getById(req.params.id);

    if (!announcement) {
      const err = new Error("Pengumuman tidak ditemukan");
      err.statusCode = 404;
      return next(err);
    }

    res.render("announcement/show", {
      ...RENDER_DEFAULTS(req),
      title: announcement.title,
      announcement,
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUBLISH ──────────────────────────────────────────────────────────────────
export const publish = async (req, res, next) => {
  try {
    await announcementService.publish(req.params.id);
    return res.redirect("/announcement");
  } catch (err) {
    next(err);
  }
};
