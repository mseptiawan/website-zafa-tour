import { uploadFile } from "../middlewares/uploadFile.js";
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import mongoose from "mongoose";

import {
  createTripService,
  getTripDetailService,
  resubmitTripService,
  delegateTripToHRService,
  getEditableTripService,
  handleApprovalService,
  updateTripService,
  getApprovalTripsService,
} from "../services/trip.service.js";
import BusinessTrip from "../models/BusinessTrip.model.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";

export const newForm = (req, res) => {
  res.render("trip/user/create", { title: "Pengajuan Dinas Luar", old: {}, errors: {} });
};

export const create = async (req, res) => {
  try {
    const trip = await createTripService({
      user: req.session.user,
      body: req.body,
    });

    return res.redirect("/trip/my");
  } catch (err) {
    console.error(err);
    const status = err.status || 400;
    const errorMessage = err.message || "Gagal membuat pengajuan";

    return res.status(status).render("trip/user/create", {
      title: "Pengajuan Dinas Luar",
      old: req.body,
      errors: { global: errorMessage },
    });
  }
};

export const approvalPage = async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) return res.status(401).send("Session expired");

    const trips = await getApprovalTripsService(user);

    const activeStatuses = ["PENDING", "IN_REVIEW"];
    const activeTrips = trips.filter((t) =>
      activeStatuses.includes((t.status || "").toUpperCase().trim())
    );
    const historyTrips = trips.filter(
      (t) => !activeStatuses.includes((t.status || "").toUpperCase().trim())
    );

    return res.render("trip/user/approvals", {
      title: "Approval Dinas Luar",
      activeTrips, 
      historyTrips, 
      user,
      error: null,
    });
  } catch (err) {
    if (err.message === "FORBIDDEN") {
      return res.status(403).send("Tidak memiliki akses approval");
    }
    return res.status(500).send(`Error load approval page: ${err.message}`);
  }
};

export const approvalDetailPage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send("Invalid ID");

    const trip = await BusinessTrip.findById(id).populate("userId");
    if (!trip) return res.status(404).send("Trip not found");

    return res.render("trip/approval/approval-detail", {
      title: "Detail Persetujuan",
      trip,
      user: req.session.user,
      error: null,
      approvals: trip.approvals || [],
    });
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

export const handleApproval = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send("Invalid ID");

    await handleApprovalService({
      id,
      user: req.session.user,
      action: req.body.action,
      note: req.body.note,
    });

    return res.redirect(`/trip/approval/${id}`);
  } catch (err) {
    const trip = await BusinessTrip.findById(req.params.id);
    return res.status(err.status || 400).render("trip/approval/approval-detail", {
      title: "Approval Trip",
      user: req.session.user,
      error: err.message,
      id: req.params.id,
      trip,
    });
  }
};

export const delegateTripToHR = async (req, res) => {
  try {
    const trip = await delegateTripToHRService({
      id: req.params.id,
      user: req.session.user,
    });
    return res.redirect(`/trip/approval/${trip._id}`);
  } catch (err) {
    return res.status(err.status || 500).send(err.message);
  }
};

export const myTrips = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination({
      page: req.query.page,
      limit: 10,
    });

    const query = { userId: req.session.user._id };
    const [trips, total] = await Promise.all([
      BusinessTrip.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      BusinessTrip.countDocuments(query),
    ]);

    const pagination = getPaginationMeta({ page, limit, total });

    res.render("trip/user/history", {
      title: "Perjalanan Saya",
      trips,
      pagination,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Gagal memuat data", errors: null });
  }
};

export const show = async (req, res) => {
  try {
    const trip = await getTripDetailService(req.params.id);
    if (!trip) return res.status(404).render("errors/404", { title: "Data Tidak Ditemukan" });

    res.render("trip/user/detail", {
      title: "Detail Perjalanan Dinas",
      trip,
      approvals: trip.approvals || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal memuat detail perjalanan" });
  }
};

export const showEditForm = async (req, res) => {
  try {
    const trip = await getEditableTripService(req.params.id, req.session.user._id);
    return res.render("trip/user/edit", { title: "Edit Pengajuan", trip });
  } catch (err) {
    if (err.message === "INVALID_ID" || err.message === "NOT_FOUND")
      return res.status(404).send("Data tidak ditemukan");
    if (err.message === "FORBIDDEN") return res.status(403).send("Tidak dapat mengedit pengajuan");
    return res.status(500).send("Error load edit form");
  }
};

export const update = async (req, res) => {
  try {
    await updateTripService(req.params.id, req.session.user._id, req.body);
    return res.redirect("/trip/my");
  } catch (err) {
    if (err.message === "INVALID_ID" || err.message === "NOT_FOUND")
      return res.status(404).send("Data tidak ditemukan");
    if (err.message === "FORBIDDEN") return res.status(403).send("Pengajuan tidak dapat diedit");
    return res.status(500).send("Error update pengajuan");
  }
};

export const resubmit = async (req, res) => {
  try {
    await resubmitTripService(req.params.id, req.session.user._id, req.body);
    return res.redirect("/trip/my");
  } catch (err) {
    if (err.message === "INVALID_ID" || err.message === "NOT_FOUND")
      return res.status(404).send("Data tidak ditemukan");
    if (err.message === "FORBIDDEN")
      return res.status(403).send("Pengajuan tidak dapat diajukan ulang");
    return res.status(500).send("Error resubmit pengajuan");
  }
};

export const startTrip = async (req, res, next) => {
  try {
    const trip = await BusinessTrip.findById(req.params.id);
    if (!trip) return res.status(404).send("Trip not found");
    if (trip.userId.toString() !== req.session.user._id.toString())
      return res.status(403).send("Forbidden");
    if (trip.status !== "PAID") return res.status(400).send("Trip belum dibayar oleh Keuangan");

    trip.status = "ON_TRIP";
    trip.startedAt = new Date();
    await trip.save();

    return res.redirect(`/trip/${trip._id}`);
  } catch (err) {
    next(err);
  }
};

export const reportTripPage = async (req, res, next) => {
  try {
    const trip = await BusinessTrip.findById(req.params.id);
    if (!trip) return res.status(404).send("Trip not found");
    return res.render("trip/report", { title: "Laporan Perjalanan", trip });
  } catch (err) {
    next(err);
  }
};

export const submitTripReport = async (req, res, next) => {
  try {
    const trip = await BusinessTrip.findById(req.params.id);
    if (!trip) return res.status(404).send("Trip not found");
    if (trip.status !== "ON_TRIP") return res.status(400).send("Trip belum dimulai");

    trip.tripReport = {
      isSubmitted: true,
      submittedAt: new Date(),
      description: req.body.description,
      attachmentUrl: req.file ? `/uploads/files/${req.file.filename}` : null,
    };
    trip.status = "COMPLETED";

    await trip.save();
    return res.redirect(`/trip/${trip._id}`);
  } catch (err) {
    next(err);
  }
};
