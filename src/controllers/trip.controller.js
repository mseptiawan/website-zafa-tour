import mongoose from "mongoose";
import BusinessTrip from "../models/BusinessTrip.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import {
  createTripService,
  getTripDetailService,
  getEditableTripService,
  handleApprovalService,
  editTripService,
  getApprovalTripsService,
} from "../services/trip.service.js";

// ─── METHOD 1: SHOW DETAIL TRIP ───────────────────
export const getTripDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash("error", "Format ID tidak valid");
    return res.redirect("/trip/me");
  }

  const trip = await getTripDetailService(id);
  if (!trip) {
    return res.status(404).render("errors/404", {
      ...buildRenderData(req, { title: "Data Tidak Ditemukan" }),
    });
  }

  const user = req.session.user;
  const referrer = req.get("Referer") || "";
  let backLink = "/trip/me";

  if (referrer.includes("/trip/incoming")) {
    backLink = "/trip/incoming";
  }

  const rawApprovals = trip.approvals || [];
  const sortedApprovals = [...rawApprovals].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateA - dateB;
  });

  let canApprove = false;
  if (trip.status === "PENDING" || trip.status === "IN_REVIEW") {
    const userRole = (user.role || "").toUpperCase().trim();
    const currentStep = (trip.currentStep || "").toUpperCase().trim();
    if (userRole === currentStep) {
      canApprove = true;
    }
  }

  res.render("trip/detail", {
    ...buildRenderData(req, {
      title: "Detail Dinas Luar",
      trip,
      approvals: sortedApprovals,
      user,
      backLink,
      canApprove,
    }),
  });
});

// ─── METHOD 2: FORM CREATE VIEW ───────────────────
export const renderCreateTripForm = asyncHandler(async (req, res) => {
  res.render("trip/create", {
    ...buildRenderData(req, {
      title: "Pengajuan Dinas Luar",
      old: {},
      errors: {},
    }),
  });
});

// ─── METHOD 3: STORE DATA TRIP ────────────────────
export const storeTrip = asyncHandler(async (req, res) => {
  try {
    await createTripService({ user: req.session.user, body: req.body });

    req.flash("success", "Pengajuan dinas luar berhasil dibuat!");
    await new Promise((resolve) => req.session.save(resolve));

    return res.redirect("/trip/me");
  } catch (err) {
    req.flash("error", err.message || "Gagal membuat pengajuan");

    return res.status(err.status || 400).render("trip/create", {
      ...buildRenderData(req, {
        title: "Pengajuan Dinas Luar",
        old: req.body,
        errors: { global: err.message || "Gagal membuat pengajuan" },
      }),
    });
  }
});

// ─── METHOD 4: PERSONAL HISTORY VIEW ──────────────
export const getTripHistory = asyncHandler(async (req, res) => {
  const { page } = req.query;
  const { page: currentPage, limit, skip } = getPagination({ page, limit: 10 });
  const query = { userId: req.session.user._id };

  const [trips, total] = await Promise.all([
    BusinessTrip.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    BusinessTrip.countDocuments(query),
  ]);

  res.render("trip/history", {
    ...buildRenderData(req, {
      title: "Dinas Luar Saya",
      trips,
      pagination: getPaginationMeta({ page: currentPage, limit, total }),
    }),
  });
});

// ─── METHOD 5: INCOMING APPROVALS VIEW ─────────────
export const getIncomingTrips = asyncHandler(async (req, res) => {
  const user = req.session.user;
  if (!user) {
    req.flash("error", "Sesi telah berakhir, silakan login kembali.");
    return res.redirect("/login");
  }

  const trips = await getApprovalTripsService(user);
  const activeStatuses = ["PENDING", "IN_REVIEW"];

  const activeTrips = trips.filter((t) => activeStatuses.includes((t.status || "").toUpperCase()));
  const historyTrips = trips.filter(
    (t) => !activeStatuses.includes((t.status || "").toUpperCase())
  );

  res.render("trip/approvals", {
    ...buildRenderData(req, {
      title: "Persetujuan Dinas Luar",
      activeTrips,
      historyTrips,
      user,
    }),
  });
});

// ─── METHOD 6: ACTION APPROVE / REJECT ────────────
export const actionTripApproval = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash("error", "Format ID tidak valid");
    return res.redirect("/trip/incoming");
  }

  const action = req.body.action;

  try {
    const result = await handleApprovalService({
      id,
      user: req.session.user,
      action: action,
      note: req.body.note || req.body.notes,
      file: req.file,
    });

    if (action === "REJECT") {
      req.flash("error", result.message || "Pengajuan resmi ditolak.");
    } else {
      req.flash("success", result.message || "Pengajuan berhasil disetujui!");
    }

    await new Promise((resolve) => req.session.save(resolve));
    return res.redirect(`/trip/detail/${id}`);
  } catch (err) {
    req.flash("error", err.message);
    await new Promise((resolve) => req.session.save(resolve));
    return res.redirect(`/trip/detail/${id}`);
  }
});

// ─── METHOD 7: FORM EDIT VIEW ─────────────────────
export const renderEditTripForm = asyncHandler(async (req, res) => {
  try {
    const trip = await getEditableTripService(req.params.id, req.session.user._id);

    return res.render("trip/create", {
      ...buildRenderData(req, {
        title: "Edit Pengajuan",
        old: trip,
        mode: "EDIT",
      }),
    });
  } catch (err) {
    if (err.message === "INVALID_ID" || err.message === "NOT_FOUND") {
      req.flash("error", "Data tidak ditemukan");
    } else if (err.message === "FORBIDDEN") {
      req.flash("error", "Tidak dapat mengedit pengajuan yang sedang/sudah diproses");
    } else {
      req.flash("error", "Gagal memuat halaman edit");
    }

    await new Promise((resolve) => req.session.save(resolve));
    return res.redirect("/trip/me");
  }
});

// ─── METHOD 8: UPDATE DATA TRIP ───────────────────
export const updateTrip = asyncHandler(async (req, res) => {
  try {
    await editTripService(req.params.id, req.session.user._id, req.body);

    req.flash("success", "Pengajuan dinas luar berhasil diperbarui!");
    await new Promise((resolve) => req.session.save(resolve));

    return res.redirect("/trip/me");
  } catch (err) {
    if (err.message === "INVALID_ID" || err.message === "NOT_FOUND") {
      req.flash("error", "Data tidak ditemukan");
      return res.redirect("/trip/me");
    }
    if (err.message === "FORBIDDEN") {
      req.flash("error", "Pengajuan tidak dapat diedit karena sudah diproses");
      return res.redirect("/trip/me");
    }

    req.flash("error", err.message || "Error update pengajuan");
    await new Promise((resolve) => req.session.save(resolve));
    return res.redirect(`/trip/me`);
  }
});
