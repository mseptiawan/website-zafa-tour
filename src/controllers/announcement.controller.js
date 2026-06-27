import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
} from "../services/announcement.service.js";

// ─── NEW FORM ─────────────────────────────────────────────────────────────────
export const create = asyncHandler(async (req, res) => {
  res.render("announcement/create", {
    ...buildRenderData(req, {
      title: "Buat Pengumuman",
      old: {},
      errors: {},
    }),
  });
});

// ─── STORE ───────────────────────────────────────────────────────────────────
export const store = asyncHandler(async (req, res) => {
  if (req.validationErrors) {
    req.flash("error", "Mohon periksa kembali form pengisian Anda.");

    return res.status(400).render("announcement/create", {
      ...buildRenderData(req, {
        title: "Buat Pengumuman",
        errors: req.validationErrors,
        old: req.body,
      }),
    });
  }

  const userRole = req.session.user.role;
  const announcementData = { ...req.body };

  if (userRole !== "DIREKTUR_UTAMA") {
    announcementData.category = "LIGHT";
  }

  await createAnnouncement({
    body: announcementData,
    userSession: req.session.user,
    file: req.file,
  });
  req.flash("success", "Pengumuman berhasil diterbitkan!");
  return res.redirect("/announcement");
});

// ─── INDEX ────────────────────────────────────────────────────────────────────
export const index = asyncHandler(async (req, res) => {
  const result = await getAllAnnouncements({
    page: req.query.page,
    isMobile: req.useragent?.isMobile,
  });

  res.render("announcement/index", {
    ...buildRenderData(req, {
      title: "Semua Pengumuman",
      announcements: result.data,
      pagination: result.meta,
    }),
  });
});

// ─── SHOW ─────────────────────────────────────────────────────────────────────
export const show = asyncHandler(async (req, res) => {
  const announcement = await getAnnouncementById(req.params.id);

  if (!announcement) {
    const err = new Error("Pengumuman tidak ditemukan");
    err.statusCode = 404;
    throw err;
  }

  res.render("announcement/show", {
    ...buildRenderData(req, {
      title: announcement.title,
      announcement,
    }),
  });
});
