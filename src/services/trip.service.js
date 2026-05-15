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

export const getEditableTripService = async ({ id, userId }) => {
  const trip = await BusinessTrip.findOne({
    _id: id,
    userId,
  });

  if (!trip) throw new Error("NOT_FOUND");

  const allowed = ["PENDING", "REJECTED"];

  if (!allowed.includes(trip.status)) {
    throw new Error("LOCKED");
  }

  return trip;
};

/* =========================
   UPDATE + RESUBMIT SERVICE
========================= */
export const updateTripService = async ({ id, userId, body }) => {
  const trip = await BusinessTrip.findOne({
    _id: id,
    userId,
  });

  if (!trip) throw new Error("NOT_FOUND");

  const allowed = ["PENDING", "REJECTED"];

  if (!allowed.includes(trip.status)) {
    throw new Error("LOCKED");
  }

  // update field aman
  const {
    title,
    purpose,
    startDate,
    endDate,
    destination,
    description,
    budget,
    contactPerson,
    timeline,
  } = body;

  trip.title = title;
  trip.purpose = purpose;
  trip.startDate = startDate;
  trip.endDate = endDate;
  trip.destination = destination;
  trip.description = description;
  trip.budget = Number(budget);
  trip.contactPerson = contactPerson;

  const normalizedTimeline = Array.isArray(timeline)
    ? timeline.map((t, i) => ({
        address: typeof t === "string" ? t : t.address,
        order: i + 1,
      }))
    : [];

  trip.timeline = normalizedTimeline;

  // RULE RESUBMIT:
  // setiap update → reset workflow
  trip.status = "PENDING";
  trip.currentStep = "MANAGER";

  await trip.save();

  return trip;
};

/* =========================
   APPROVAL PAGE
========================= */
export const approvalPageService = async (user) => {
  let filter = {};

  if (user.role === "MANAGER") {
    filter = { status: { $in: ["PENDING", "IN_REVIEW"] }, currentStep: "MANAGER" };
  }

  if (user.role === "PIMPINAN") {
    filter = { status: { $in: ["PENDING", "IN_REVIEW"] }, currentStep: "PIMPINAN" };
  }

  if (user.role === "HR") {
    filter = {
      status: { $in: ["PENDING", "IN_REVIEW"] },
      currentStep: "PIMPINAN",
      "delegation.active": true,
      "delegation.to": "HR",
    };
  }

  return await BusinessTrip.find(filter).sort({ createdAt: -1 });
};

/* =========================
   APPROVAL ACTION SERVICE
========================= */
export const handleApprovalService = async ({ id, user, action, note }) => {
  const trip = await BusinessTrip.findById(id);

  if (!trip) throw new Error("NOT_FOUND");

  const role = user.role;
  const step = trip.currentStep;

  if (action === "APPROVE") {
    trip.approvals.push({
      role: step,
      userId: user._id,
      status: "APPROVED",
      date: new Date(),
    });

    if (step === "MANAGER") {
      trip.currentStep = "PIMPINAN";
      trip.status = "IN_REVIEW";
    } else {
      trip.currentStep = null;
      trip.status = "APPROVED";
      trip.delegation.active = false;
    }
  }

  if (action === "REJECT") {
    trip.approvals.push({
      role: step,
      userId: user._id,
      status: "REJECTED",
      note,
      date: new Date(),
    });

    trip.status = "REJECTED";
    trip.currentStep = null;
    trip.delegation.active = false;
  }

  if (action === "DELEGATE_TO_HR") {
    trip.delegation = {
      from: "PIMPINAN",
      to: "HR",
      active: true,
      createdBy: user._id,
      createdAt: new Date(),
      note,
    };
  }

  await trip.save();

  return trip;
};

/* =========================
   PAYMENT SERVICE
========================= */
export const confirmPaymentService = async ({ id, user }) => {
  const trip = await BusinessTrip.findById(id);

  if (!trip) throw new Error("NOT_FOUND");

  if (trip.status !== "APPROVED") {
    throw new Error("ONLY_APPROVED");
  }

  trip.paymentStatus = "PAID";
  trip.paidAt = new Date();
  trip.paidBy = user._id;

  await trip.save();

  return trip;
};

export const getMyTripsService = async (userId) => {
  return await BusinessTrip.find({
    userId,
  }).sort({
    createdAt: -1,
  });
};
