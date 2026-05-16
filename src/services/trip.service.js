import mongoose from "mongoose";
import BusinessTrip from "../models/BusinessTrip.js";

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

  let currentStep = "MANAGER";
  let status = "PENDING";

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

  const trip = await BusinessTrip.create({
    userId: user._id,
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
  return await BusinessTrip.find({
    userId,
  }).sort({
    createdAt: -1,
  });
};

export const getTripDetailService = async (id) => {
  return await BusinessTrip.findById(id);
};
export const getApprovalTripsService = async (role) => {
  let filter = {};

  if (role === "MANAGER") {
    filter = {
      status: {
        $in: ["PENDING", "IN_REVIEW"],
      },

      currentStep: "MANAGER",
    };
  } else if (role === "PIMPINAN") {
    filter = {
      status: {
        $in: ["PENDING", "IN_REVIEW"],
      },

      currentStep: "PIMPINAN",
    };
  } else if (role === "HR") {
    filter = {
      status: {
        $in: ["PENDING", "IN_REVIEW"],
      },

      currentStep: "PIMPINAN",

      "delegation.active": true,

      "delegation.to": "HR",
    };
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
    .sort({
      createdAt: -1,
    });
};

const editableStatuses = ["PENDING", "REJECTED"];

export const getEditableTripService = async (id, userId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("INVALID_ID");
  }

  const trip = await BusinessTrip.findOne({
    _id: id,
    userId,
  });

  if (!trip) {
    throw new Error("NOT_FOUND");
  }

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

  trip.title = body.title;
  trip.destination = body.destination;
  trip.description = body.description;
  trip.meetWith = body.meetWith;
  trip.startDate = body.startDate;
  trip.endDate = body.endDate;
  trip.budget = body.budget;

  await trip.save();

  return trip;
};

export const resubmitTripService = async (id, userId, body) => {
  const trip = await getEditableTripService(id, userId);

  if (trip.status !== "REJECTED") {
    throw new Error("FORBIDDEN");
  }

  trip.title = body.title;
  trip.destination = body.destination;
  trip.description = body.description;
  trip.meetWith = body.meetWith;
  trip.startDate = body.startDate;
  trip.endDate = body.endDate;
  trip.budget = body.budget;

  const lastRejectedApproval = [...trip.approvals].reverse().find((a) => a.status === "REJECTED");

  if (!lastRejectedApproval) {
    throw new Error("REJECT_HISTORY_NOT_FOUND");
  }

  if (lastRejectedApproval.role === "MANAGER") {
    trip.status = "PENDING";

    trip.currentStep = "MANAGER";
  } else if (lastRejectedApproval.role === "PIMPINAN") {
    trip.status = "IN_REVIEW";

    trip.currentStep = "PIMPINAN";
  }

  trip.approvals = [];

  if (trip.delegation) {
    trip.delegation.active = false;
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

  const currentStep = trip.currentStep;

  const isManager = role === "MANAGER";

  const isPimpinan = role === "PIMPINAN";

  const isHRDelegatedAsPimpinan =
    role === "HR" && currentStep === "PIMPINAN" && trip.delegation?.active === true;

  if (currentStep === "MANAGER" && !isManager) {
    const err = new Error("Hanya Manager yang bisa approve tahap ini");

    err.status = 403;

    throw err;
  }

  if (currentStep === "PIMPINAN" && !isPimpinan && !isHRDelegatedAsPimpinan) {
    const err = new Error("Tidak memiliki akses approval pimpinan");

    err.status = 403;

    throw err;
  }

  if (action === "DELEGATE_TO_HR") {
    if (!isPimpinan) {
      const err = new Error("Hanya pimpinan yang bisa mendelegasikan");

      err.status = 403;

      throw err;
    }

    trip.delegation = {
      from: "PIMPINAN",
      to: "HR",
      active: true,
      createdBy: user._id,
      createdAt: new Date(),
      note: note || "Delegasi approval ke HR",
    };

    await trip.save();

    return {
      message: "Approval berhasil didelegasikan ke HR",
    };
  }

  if (action === "REJECT") {
    if (!note || note.trim().length < 5) {
      const err = new Error("Alasan reject minimal 5 karakter");

      err.status = 400;

      throw err;
    }

    trip.approvals.push({
      role: currentStep,

      actingAs: role,

      userId: user._id,

      status: "REJECTED",

      date: new Date(),

      note,
    });

    trip.status = "REJECTED";

    trip.currentStep = null;

    if (trip.delegation) {
      trip.delegation.active = false;
    }

    await trip.save();

    return {
      message: "Pengajuan berhasil ditolak",
    };
  }

  if (action === "APPROVE") {
    trip.approvals.push({
      role: currentStep,

      actingAs: role,

      userId: user._id,

      status: "APPROVED",

      date: new Date(),
    });

    if (currentStep === "MANAGER") {
      trip.currentStep = "PIMPINAN";

      trip.status = "IN_REVIEW";
    } else if (currentStep === "PIMPINAN") {
      trip.currentStep = null;

      trip.status = "APPROVED";

      if (trip.delegation) {
        trip.delegation.active = false;
      }
    }

    await trip.save();

    return {
      message: "Pengajuan berhasil disetujui",
    };
  }

  const err = new Error("Action tidak valid");

  err.status = 400;

  throw err;
};
