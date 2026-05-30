import mongoose from "mongoose";
import BusinessTrip from "../models/BusinessTrip.model.js";
import { X } from "lucide-react";

export const createTripService = async ({ user, body }) => {
  if (!user) {
    const err = new Error("Session tidak valid");
    err.status = 401;
    throw err;
  }

  let { title, purpose, startDate, endDate, destination, description, budget, meetWith, timeline } =
    body;

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

  let currentStep = "MANAGER_ADMINISTRASI";
  let status = "PENDING";

  if (user.role === "MANAGER_ADMINISTRASI") {
    currentStep = "DIREKTUR_UTAMA";
    status = "IN_REVIEW";
  }

  if (user.role === "WAKIL_DIREKTUR") {
    currentStep = "MANAGER_ADMINISTRASI";
    status = "PENDING";
  }

  if (user.role === "PEGAWAI" || user.role === "MANAGER_KEUANGAN") {
    currentStep = "MANAGER_ADMINISTRASI";
    status = "PENDING";
  }

  const trip = await BusinessTrip.create({
    userId: user._id,
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

export const getMyTripsService = async (userId) => {
  return await BusinessTrip.find({ userId }).sort({ createdAt: -1 });
};

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

export const getApprovalTripsService = async (role) => {
  let filter = {
    status: { $in: ["PENDING", "IN_REVIEW"] },
  };

  if (role === "MANAGER_ADMINISTRASI") {
    filter.currentStep = "MANAGER_ADMINISTRASI";
  } else if (role === "DIREKTUR_UTAMA") {
    filter.currentStep = "DIREKTUR_UTAMA";
  } else if (role === "WAKIL_DIREKTUR") {
    filter.currentStep = "DIREKTUR_UTAMA";
    filter["delegation.active"] = true;
    filter["delegation.to"] = "WAKIL_DIREKTUR";
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

export const resubmitTripService = async (id, userId, body) => {
  const trip = await getEditableTripService(id, userId);

  if (trip.status !== "REJECTED") {
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

  const lastRejected = [...trip.approvals].reverse().find((a) => a.status === "REJECTED");

  if (!lastRejected) {
    throw new Error("REJECT_HISTORY_NOT_FOUND");
  }

  const isHRFlow =
    trip.delegation?.active === true &&
    trip.delegation?.to === "WAKIL_DIREKTUR" &&
    lastRejected.actor === "WAKIL_DIREKTUR";

  trip.approvals = [];
  trip.status = "IN_REVIEW";

  if (isHRFlow) {
    trip.currentStep = "DIREKTUR_UTAMA";
    trip.delegation.active = true;
  } else if (lastRejected.step === "DIREKTUR_UTAMA") {
    trip.currentStep = "DIREKTUR_UTAMA";
    trip.delegation.active = false;
  } else if (lastRejected.step === "MANAGER_ADMINISTRASI") {
    trip.status = "PENDING";
    trip.currentStep = "MANAGER_ADMINISTRASI";
    trip.delegation.active = false;
  } else {
    throw new Error("INVALID_WORKFLOW_STATE");
  }

  if (!trip.delegation?.active) {
    trip.delegation = {
      active: false,
      from: null,
      to: null,
      delegatedBy: null,
      delegatedAt: null,
    };
  }

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
    trip.delegation?.active && step === "DIREKTUR_UTAMA" && role === "WAKIL_DIREKTUR"
      ? "WAKIL_DIREKTUR"
      : role;

  if (action === "APPROVE") {
    trip.approvals.push({
      step,
      actor: effectiveActor,
      userId: user._id,
      status: "APPROVED",
      date: new Date(),
      note: note || null,
    });

    if (step === "MANAGER_ADMINISTRASI") {
      trip.currentStep = "DIREKTUR_UTAMA";
      trip.status = "IN_REVIEW";
    }

    if (step === "DIREKTUR_UTAMA") {
      trip.status = "APPROVED";
      trip.currentStep = null;

      trip.payment.status = "PENDING";
      trip.payment.amount = trip.budget || 0;
    }

    await trip.save();
    return { message: "Approved" };
  }

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
    trip.currentStep = null;

    await trip.save();
    return { message: "Rejected" };
  }

  if (action === "DELEGATE_TO_HR") {
    if (role !== "DIREKTUR_UTAMA" || step !== "DIREKTUR_UTAMA") {
      const err = new Error("Tidak boleh delegasi");
      err.status = 403;
      throw err;
    }

    if (trip.requesterRole === "WAKIL_DIREKTUR") {
      const err = new Error("HR request tidak boleh didelegasikan");
      err.status = 400;
      throw err;
    }

    trip.delegation = {
      active: true,
      from: "DIREKTUR_UTAMA",
      to: "WAKIL_DIREKTUR",
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

  if (user.role !== "DIREKTUR_UTAMA") {
    const err = new Error("Hanya pimpinan yang dapat delegasi");
    err.status = 403;
    throw err;
  }

  if (trip.status !== "IN_REVIEW") {
    const err = new Error("Trip tidak dalam proses approval");
    err.status = 400;
    throw err;
  }

  if (trip.currentStep !== "DIREKTUR_UTAMA") {
    const err = new Error("Delegasi hanya saat tahap pimpinan");
    err.status = 400;
    throw err;
  }

  if (trip.requesterRole === "WAKIL_DIREKTUR") {
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
    from: "DIREKTUR_UTAMA",
    to: "WAKIL_DIREKTUR",
    delegatedBy: user._id,
    delegatedAt: new Date(),
  };

  await trip.save();

  return trip;
};
