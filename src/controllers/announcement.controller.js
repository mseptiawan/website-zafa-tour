import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";

import {
  createAnnouncementService,
  getAllAnnouncementsService,
  getAnnouncementByIdService,
} from "../services/announcement.service.js";

// ─── METHOD 1: RENDER FORM CREATE ─────────────────────────────────────────────
export const renderCreateAnnouncementForm = asyncHandler(async (req, res) => {
  res.render("announcement/create", {
    ...buildRenderData(req, {
      title: "Buat Pengumuman",
      old: {},
      errors: {},
    }),
  });
});

// ─── METHOD 2: STORE / CREATE DATA ───────────────────────────────────────────
export const createAnnouncement = asyncHandler(async (req, res) => {
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

  await createAnnouncementService({
    body: announcementData,
    userSession: req.session.user,
    file: req.file,
  });

  req.flash("success", "Pengumuman berhasil diterbitkan!");
  return res.redirect("/announcement");
});

// ─── METHOD 3: GET INDEX ALL ──────────────────────────────────────────────────
export const getAllAnnouncements = asyncHandler(async (req, res) => {
  const result = await getAllAnnouncementsService({
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

// ─── METHOD 4: GET SHOW DETAIL ────────────────────────────────────────────────
export const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await getAnnouncementByIdService(req.params.id);

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
