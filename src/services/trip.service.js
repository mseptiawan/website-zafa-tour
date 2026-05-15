import BusinessTrip from "../models/BusinessTrip.js";

/* =========================
   EDIT FORM SERVICE
========================= */
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
