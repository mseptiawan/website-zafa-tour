import { getPagination, getPaginationMeta } from "../utils/pagination.js";

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
  getMyTripsService,
} from "../services/trip.service.js";
import BusinessTrip from "../models/BusinessTrip.js";
export const newForm = (req, res) => {
  res.render("trip/user/create", { title: "Pengajuan Dinas Luar", error: null });
};

export const create = async (req, res) => {
  try {
    const trip = await createTripService({
      user: req.session.user,
      body: req.body,
      error: null,
    });

    return res.redirect("/trip/my");
  } catch (err) {
    console.error(err);

    const status = err.status || 500;

    return res.status(status).send(err.message || "Gagal membuat pengajuan");
  }
};

export const approvalPage = async (req, res) => {
  try {
    const user = req.session.user;

    const trips = await getApprovalTripsService(user.role);

    return res.render("trip/approval", {
      title: "Approval Dinas Luar",
      trips,
      user,
      error: null,
    });
  } catch (err) {
    console.log(err);

    if (err.message === "FORBIDDEN") {
      return res.status(403).send("Tidak memiliki akses approval");
    }

    return res.status(500).send("Error load approval page");
  }
};

export const approvalDetailPage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("Invalid ID");
    }

    const trip = await BusinessTrip.findById(id).populate("userId");

    if (!trip) {
      return res.status(404).send("Trip not found");
    }

    return res.render("trip/approval/approval-detail", {
      title: "Detail Persetujuan",
      trip,
      user: req.session.user,
    });
  } catch (err) {
    return res.status(500).send(err.message);
  }
};
export const handleApproval = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("Invalid ID");
    }

    await handleApprovalService({
      id,
      user: req.session.user,
      action: req.body.action,
      note: req.body.note,
    });

    return res.redirect(`/trip/approval/${id}`);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).send(err.message);
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

    const query = {
      userId: req.session.user._id,
    };

    const [trips, total] = await Promise.all([
      BusinessTrip.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),

      BusinessTrip.countDocuments(query),
    ]);

    const pagination = getPaginationMeta({
      page,
      limit,
      total,
    });

    res.render("trip/user/my", {
      title: "Perjalanan Saya",
      trips,
      pagination,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Gagal memuat data",
      errors: null,
    });
  }
};

export const show = async (req, res) => {
  try {
    const trip = await getTripDetailService(req.params.id);

    if (!trip) {
      return res.status(404).render("errors/404", {
        title: "Data Tidak Ditemukan",
      });
    }

    res.render("trip/user/show", {
      title: "Detail Perjalanan Dinas",
      trip,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Gagal memuat detail perjalanan",
      errors: null,
    });
  }
};

export const showEditForm = async (req, res) => {
  try {
    const trip = await getEditableTripService(req.params.id, req.session.user._id);

    return res.render("trip/user/edit", {
      title: "Edit Pengajuan",
      trip,
    });
  } catch (err) {
    console.log(err);

    if (err.message === "INVALID_ID" || err.message === "NOT_FOUND") {
      return res.status(404).send("Data tidak ditemukan");
    }

    if (err.message === "FORBIDDEN") {
      return res.status(403).send("Tidak dapat mengedit pengajuan");
    }

    return res.status(500).send("Error load edit form");
  }
};

export const update = async (req, res) => {
  try {
    await updateTripService(req.params.id, req.session.user._id, req.body);

    return res.redirect("/trip/my");
  } catch (err) {
    console.log(err);

    if (err.message === "INVALID_ID" || err.message === "NOT_FOUND") {
      return res.status(404).send("Data tidak ditemukan");
    }

    if (err.message === "FORBIDDEN") {
      return res.status(403).send("Pengajuan tidak dapat diedit");
    }

    return res.status(500).send("Error update pengajuan");
  }
};

export const resubmit = async (req, res) => {
  try {
    await resubmitTripService(req.params.id, req.session.user._id, req.body);

    return res.redirect("/trip/my");
  } catch (err) {
    console.log(err);

    if (err.message === "INVALID_ID" || err.message === "NOT_FOUND") {
      return res.status(404).send("Data tidak ditemukan");
    }

    if (err.message === "FORBIDDEN") {
      return res.status(403).send("Pengajuan tidak dapat diajukan ulang");
    }

    return res.status(500).send("Error resubmit pengajuan");
  }
};

export const startTrip = async (req, res, next) => {
  try {
    const trip = await BusinessTrip.findById(req.params.id);

    if (!trip) {
      return res.status(404).send("Trip not found");
    }

    // hanya pemilik trip
    if (trip.userId.toString() !== req.session.user._id.toString()) {
      return res.status(403).send("Forbidden");
    }

    // hanya bisa mulai jika ready
    if (trip.status !== "READY_TO_TRAVEL") {
      return res.status(400).send("Trip belum siap dimulai");
    }

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

    if (!trip) {
      return res.status(404).send("Trip not found");
    }

    return res.render("trip/report", {
      title: "Laporan Perjalanan",
      trip,
    });
  } catch (err) {
    next(err);
  }
};

export const submitTripReport = async (req, res, next) => {
  try {
    const trip = await BusinessTrip.findById(req.params.id);

    if (!trip) {
      return res.status(404).send("Trip not found");
    }

    if (trip.status !== "ON_TRIP") {
      return res.status(400).send("Trip belum dimulai");
    }

    const attachments = (req.files || []).map((file) => ({
      filename: file.filename,
      url: `/uploads/files/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
    }));

    trip.tripReport = {
      isSubmitted: true,
      submittedAt: new Date(),
      description: req.body.description,
      attachments,
    };

    trip.status = "SUBMITTED";

    await trip.save();

    return res.redirect(`/trip/${trip._id}`);
  } catch (err) {
    next(err);
  }
};
