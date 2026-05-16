import mongoose from "mongoose";
import BusinessTrip from "../models/BusinessTrip.js";
import { X } from "lucide-react";

export const createTripService = async ({ user, body }) => {
  if (!user) {
    const err = new Error("Session tidak valid");
    err.status = 401;
    throw err;
  }

  let { title, purpose, startDate, endDate, destination, description, budget, meetWith, timeline } =
    body;

  // =========================
  // NORMALIZATION
  // =========================
  title = title?.trim();
  destination = destination?.trim();
  description = description?.trim();
  budget = Number(budget);

  if (!Array.isArray(timeline)) {
    timeline = timeline ? [timeline] : [];
  }

  const normalizedTimeline = timeline
    .map((t, index) => {
      const address = typeof t === "string" ? t : t?.address || t?.trim?.();

      return {
        address,
        order: index + 1,
      };
    })
    .filter((t) => t.address);

  // =========================
  // VALIDATION
  // =========================
  if (!title || title.length < 5) {
    const err = new Error("Judul minimal 5 karakter");
    err.status = 400;
    throw err;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start) || isNaN(end) || start > end) {
    const err = new Error("Tanggal tidak valid");
    err.status = 400;
    throw err;
  }

  if (!destination || destination.length < 3) {
    const err = new Error("Destination tidak valid");
    err.status = 400;
    throw err;
  }

  if (!description || description.length < 10) {
    const err = new Error("Deskripsi terlalu pendek");
    err.status = 400;
    throw err;
  }

  if (isNaN(budget) || budget < 0) {
    const err = new Error("Budget tidak valid");
    err.status = 400;
    throw err;
  }

  if (normalizedTimeline.length === 0) {
    const err = new Error("Timeline wajib diisi");
    err.status = 400;
    throw err;
  }

  // =========================
  // STATE INITIALIZATION
  // =========================
  let currentStep = "MANAGER";
  let status = "PENDING";

  // flow logic (simple state machine)
  if (user.role === "MANAGER") {
    currentStep = "PIMPINAN";
    status = "IN_REVIEW";
  }

  if (user.role === "HR") {
    currentStep = "MANAGER";
    status = "PENDING";
  }

  if (user.role === "KARYAWAN" || user.role === "KEUANGAN") {
    currentStep = "MANAGER";
    status = "PENDING";
  }

  // =========================
  // CREATE TRIP
  // =========================
  const trip = await BusinessTrip.create({
    userId: user._id,

    // FIX ERROR WAJIB SCHEMA
    requesterRole: user.role,

    title,
    purpose,
    startDate: start,
    endDate: end,
    destination,
    description,
    budget,
    meetWith,
    timeline: normalizedTimeline,

    status,
    currentStep,

    approvals: [],

    delegation: {
      active: false,
    },
  });

  return trip;
};

// ======================================================
// GET MY TRIPS
// ======================================================
export const getMyTripsService = async (userId) => {
  return await BusinessTrip.find({ userId }).sort({ createdAt: -1 });
};

// ======================================================
// GET TRIP DETAIL
// ======================================================
export const getTripDetailService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("INVALID_ID");
  }

  const trip = await BusinessTrip.findById(id).populate({
    path: "userId",
    select: "username roleId",
    populate: {
      path: "roleId",
      select: "name",
    },
  });

  if (!trip) throw new Error("NOT_FOUND");

  return trip;
};

// ======================================================
// APPROVAL LIST (ROLE BASED WORKFLOW)
// ======================================================
export const getApprovalTripsService = async (role) => {
  let filter = {
    status: { $in: ["PENDING", "IN_REVIEW"] },
  };

  if (role === "MANAGER") {
    filter.currentStep = "MANAGER";
  } else if (role === "PIMPINAN") {
    filter.currentStep = "PIMPINAN";
  } else if (role === "HR") {
    filter.currentStep = "PIMPINAN";
    filter["delegation.active"] = true;
    filter["delegation.to"] = "HR";
  } else {
    throw new Error("FORBIDDEN");
  }

  return await BusinessTrip.find(filter)
    .populate({
      path: "userId",
      select: "username roleId",
      populate: {
        path: "roleId",
        select: "name",
      },
    })
    .sort({ createdAt: -1 });
};

// ======================================================
// EDITABLE CHECK
// ======================================================
const editableStatuses = ["PENDING", "REJECTED"];

export const getEditableTripService = async (id, userId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("INVALID_ID");
  }

  const trip = await BusinessTrip.findOne({ _id: id, userId });

  if (!trip) throw new Error("NOT_FOUND");

  if (!editableStatuses.includes(trip.status)) {
    throw new Error("FORBIDDEN");
  }

  return trip;
};

// ======================================================
// UPDATE TRIP (ONLY PENDING)
// ======================================================
export const updateTripService = async (id, userId, body) => {
  const trip = await getEditableTripService(id, userId);

  if (trip.status !== "PENDING") {
    throw new Error("FORBIDDEN");
  }

  Object.assign(trip, {
    title: body.title,
    destination: body.destination,
    description: body.description,
    meetWith: body.meetWith,
    startDate: body.startDate,
    endDate: body.endDate,
    budget: body.budget,
  });

  await trip.save();

  return trip;
};

// ======================================================
// RESUBMIT AFTER REJECT
// ======================================================
export const resubmitTripService = async (id, userId, body) => {
  const trip = await getEditableTripService(id, userId);

  if (trip.status !== "REJECTED") {
    throw new Error("FORBIDDEN");
  }

  // =========================
  // UPDATE DATA TRIP
  // =========================
  Object.assign(trip, {
    title: body.title,
    destination: body.destination,
    description: body.description,
    meetWith: body.meetWith,
    startDate: body.startDate,
    endDate: body.endDate,
    budget: body.budget,
  });

  // =========================
  // FIND LAST REJECT
  // =========================
  const lastRejected = [...trip.approvals].reverse().find((a) => a.status === "REJECTED");

  if (!lastRejected) {
    throw new Error("REJECT_HISTORY_NOT_FOUND");
  }

  // =========================
  // DETECT HR FLOW (FIXED LOGIC)
  // =========================
  const isHRFlow =
    trip.delegation?.active === true && trip.delegation?.to === "HR" && lastRejected.actor === "HR";
  // =========================
  // RESET APPROVAL HISTORY
  // =========================
  trip.approvals = [];

  // =========================
  // ROUTING RESUBMIT
  // =========================
  trip.status = "IN_REVIEW";

  if (isHRFlow) {
    // kembali ke HR lagi
    trip.currentStep = "PIMPINAN";

    // pertahankan delegation HR
    trip.delegation.active = true;
  } else if (lastRejected.step === "PIMPINAN") {
    trip.currentStep = "PIMPINAN";

    // tidak perlu HR delegation
    trip.delegation.active = false;
  } else if (lastRejected.step === "MANAGER") {
    trip.status = "PENDING";
    trip.currentStep = "MANAGER";

    trip.delegation.active = false;
  } else {
    throw new Error("INVALID_WORKFLOW_STATE");
  }

  // =========================
  // SAFE CLEANUP DELEGATION META
  // =========================
  if (!trip.delegation?.active) {
    trip.delegation = {
      active: false,
      from: null,
      to: null,
      delegatedBy: null,
      delegatedAt: null,
    };
  }

  // =========================
  // SAVE
  // =========================
  await trip.save();

  return trip;
};
export const handleApprovalService = async ({ id, user, action, note }) => {
  const trip = await BusinessTrip.findById(id);

  if (!trip) {
    const err = new Error("Data tidak ditemukan");
    err.status = 404;
    throw err;
  }

  const role = user.role;
  const step = trip.currentStep;
  const isFinal = ["APPROVED", "REJECTED"].includes(trip.status);

  if (isFinal) {
    const err = new Error("Approval sudah selesai");
    err.status = 400;
    throw err;
  }

  const effectiveActor =
    trip.delegation?.active && step === "PIMPINAN" && role === "HR" ? "HR" : role;

  // ======================
  // APPROVE
  // ======================
  if (action === "APPROVE") {
    trip.approvals.push({
      step,
      actor: effectiveActor,
      userId: user._id,
      status: "APPROVED",
      date: new Date(),
      note: note || null,
    });

    if (step === "MANAGER") {
      trip.currentStep = "PIMPINAN";
      trip.status = "IN_REVIEW";
    }

    if (step === "PIMPINAN") {
      trip.status = "APPROVED";
      trip.currentStep = null;
    }

    await trip.save();
    return { message: "Approved" };
  }

  // ======================
  // REJECT
  // ======================
  if (action === "REJECT") {
    if (!note || note.trim().length < 5) {
      const err = new Error("Alasan reject minimal 5 karakter");
      err.status = 400;
      throw err;
    }

    trip.approvals.push({
      step,
      actor: effectiveActor,
      userId: user._id,
      status: "REJECTED",
      date: new Date(),
      note,
    });

    trip.status = "REJECTED";

    await trip.save();
    return { message: "Rejected" };
  }

  // ======================
  // DELEGATE
  // ======================
  if (action === "DELEGATE_TO_HR") {
    if (role !== "PIMPINAN" || step !== "PIMPINAN") {
      const err = new Error("Tidak boleh delegasi");
      err.status = 403;
      throw err;
    }

    if (trip.requesterRole === "HR") {
      const err = new Error("HR request tidak boleh didelegasikan");
      err.status = 400;
      throw err;
    }

    trip.delegation = {
      active: true,
      from: "PIMPINAN",
      to: "HR",
      delegatedBy: user._id,
      delegatedAt: new Date(),
    };

    await trip.save();

    return { message: "Delegasi sukses" };
  }

  const err = new Error("Action tidak valid");
  err.status = 400;
  throw err;
};

export const delegateTripToHRService = async ({ id, user }) => {
  const trip = await BusinessTrip.findById(id);

  if (!trip) {
    const err = new Error("Trip tidak ditemukan");
    err.status = 404;
    throw err;
  }

  if (user.role !== "PIMPINAN") {
    const err = new Error("Hanya pimpinan yang dapat delegasi");
    err.status = 403;
    throw err;
  }

  if (trip.status !== "IN_REVIEW") {
    const err = new Error("Trip tidak dalam proses approval");
    err.status = 400;
    throw err;
  }

  if (trip.currentStep !== "PIMPINAN") {
    const err = new Error("Delegasi hanya saat tahap pimpinan");
    err.status = 400;
    throw err;
  }

  if (trip.requesterRole === "HR") {
    const err = new Error("Trip HR tidak bisa didelegasikan");
    err.status = 400;
    throw err;
  }

  if (trip.delegation?.active) {
    const err = new Error("Sudah didelegasikan");
    err.status = 400;
    throw err;
  }

  trip.delegation = {
    active: true,
    from: "PIMPINAN",
    to: "HR",
    delegatedBy: user._id,
    delegatedAt: new Date(),
  };

  await trip.save();

  return trip;
};
