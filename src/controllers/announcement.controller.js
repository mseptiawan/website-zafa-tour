import { getPagination } from "../utils/pagination.js";
import announcementService from "../services/announcement.service.js";

const RENDER_DEFAULTS = (req) => ({
  user: req.session.user,
});

// ─── NEW FORM ─────────────────────────────────────────────────────────────────
export const create = (req, res) => {
  res.render("announcement/create", {
    ...RENDER_DEFAULTS(req),
    title: "Buat Pengumuman",
    old: {},
    errors: {},
  });
};

// ─── STORE ───────────────────────────────────────────────────────────────────
export const store = async (req, res, next) => {
  try {
    if (req.validationErrors) {
      req.flash("error", "Mohon periksa kembali form pengisian Anda.");

      return res.status(400).render("announcement/create", {
        ...RENDER_DEFAULTS(req),
        title: "Buat Pengumuman",
        errors: req.validationErrors,
        old: req.body,
        success: req.flash("success"),
        error: req.flash("error"),
      });
    }

    const userRole = req.session.user.role;
    const announcementData = { ...req.body };

    if (userRole !== "DIREKTUR_UTAMA") {
      announcementData.category = "LIGHT";
    }

    await announcementService.create({
      body: announcementData,
      userSession: req.session.user,
      file: req.file,
    });

    req.session.save((err) => {
      return res.redirect("/announcement");
    });
  } catch (err) {
    req.flash("error", "Terjadi kesalahan saat menyimpan pengumuman.");
    next(err);
  }
};

// ─── INDEX ────────────────────────────────────────────────────────────────────
export const index = async (req, res, next) => {
  try {
    const result = await announcementService.getAll({
      page: req.query.page,
      isMobile: req.useragent?.isMobile,
    });

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
