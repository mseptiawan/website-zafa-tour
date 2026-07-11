import mongoose from "mongoose";
import BusinessTrip from "../models/BusinessTrip.model.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import {
  createTripService,
  getTripDetailService,
  getEditableTripService,
  handleApprovalService,
  editTripService,
  getApprovalTripsService,
} from "../services/trip.service.js";

export const getTripDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("Format ID tidak valid");
    }

    const trip = await getTripDetailService(id);
    if (!trip) {
      return res.status(404).render("errors/404", { title: "Data Tidak Ditemukan" });
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

    res.render("trip/detail", {
      title: "Detail Perjalanan Dinas",
      trip,
      approvals: sortedApprovals,
      user,
      backLink,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error saat memuat detail perjalanan");
  }
};

export const renderCreateTripForm = (req, res) => {
  res.render("trip/create", { title: "Pengajuan Dinas Luar", old: {}, errors: {} });
};

export const storeTrip = async (req, res) => {
  try {
    await createTripService({ user: req.session.user, body: req.body });
    return res.redirect("/trip/me");
  } catch (err) {
    return res.status(err.status || 400).render("trip/create", {
      title: "Pengajuan Dinas Luar",
      old: req.body,
      errors: { global: err.message || "Gagal membuat pengajuan" },
    });
  }
};

export const getTripHistory = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination({ page: req.query.page, limit: 10 });
    const query = { userId: req.session.user._id };

    const [trips, total] = await Promise.all([
      BusinessTrip.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      BusinessTrip.countDocuments(query),
    ]);

    res.render("trip/history", {
      title: "Dinas Luar Saya",
      trips,
      pagination: getPaginationMeta({ page, limit, total }),
    });
  } catch (err) {
    res.status(500).send("Gagal memuat riwayat");
  }
};

export const getIncomingTrips = async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) return res.status(401).send("Session expired");

    const trips = await getApprovalTripsService(user);
    const activeStatuses = ["PENDING", "IN_REVIEW"];

    const activeTrips = trips.filter((t) =>
      activeStatuses.includes((t.status || "").toUpperCase())
    );
    const historyTrips = trips.filter(
      (t) => !activeStatuses.includes((t.status || "").toUpperCase())
    );

    return res.render("trip/approvals", {
      title: "Persetujuan Dinas Luar",
      activeTrips,
      historyTrips,
      user,
      error: null,
    });
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

export const actionTripApproval = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send("Format ID tidak valid");

    await handleApprovalService({
      id,
      user: req.session.user,
      action: req.body.action,
      note: req.body.note || req.body.notes,
      file: req.file,
    });

    return res.redirect(`/trip/detail/${id}`);
  } catch (err) {
    return res.redirect(`/trip/detail/${req.params.id}?error=${encodeURIComponent(err.message)}`);
  }
};

export const renderEditTripForm = async (req, res) => {
  try {
    const trip = await getEditableTripService(req.params.id, req.session.user._id);

    return res.render("trip/create", {
      title: "Edit Pengajuan",
      old: trip,
      mode: "EDIT",
    });
  } catch (err) {
    if (err.message === "INVALID_ID" || err.message === "NOT_FOUND")
      return res.status(404).send("Data tidak ditemukan");
    if (err.message === "FORBIDDEN") return res.status(403).send("Tidak dapat mengedit pengajuan");
    return res.status(500).send("Error load edit form");
  }
};

export const updateTrip = async (req, res) => {
  try {
    await editTripService(req.params.id, req.session.user._id, req.body);
    return res.redirect("/trip/me");
  } catch (err) {
    if (err.message === "INVALID_ID" || err.message === "NOT_FOUND")
      return res.status(404).send("Data tidak ditemukan");
    if (err.message === "FORBIDDEN") return res.status(403).send("Pengajuan tidak dapat diedit");
    return res.status(500).send("Error update pengajuan");
  }
};
