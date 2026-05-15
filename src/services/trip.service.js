import BusinessTrip from "../models/BusinessTrip.js";

/* =========================
   CREATE TRIP
========================= */
export const createTripService = async ({ user, body }) => {
  let {
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
      return { address, order: index + 1 };
    })
    .filter((t) => t.address);

  if (!title || title.length < 5) {
    throw new Error("Judul minimal 5 karakter");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start) || isNaN(end) || start > end) {
    throw new Error("Tanggal tidak valid");
  }

  if (!destination || destination.length < 3) {
    throw new Error("Destination tidak valid");
  }

  if (!description || description.length < 10) {
    throw new Error("Deskripsi terlalu pendek");
  }

  if (isNaN(budget) || budget < 0) {
    throw new Error("Budget tidak valid");
  }

  if (normalizedTimeline.length === 0) {
    throw new Error("Timeline wajib diisi");
  }

  const contact = {
    name: contactPerson?.name?.trim() || null,
    phone: contactPerson?.phone?.trim() || null,
  };

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
    contactPerson: contact,
    timeline: normalizedTimeline,
    status,
    currentStep,
    approvals: [],
    delegation: { active: false },
  });

  return trip;
};

/* =========================
   APPROVAL PAGE
========================= */
export const approvalPageService = async (user) => {
  let filter = {};

  if (user.role === "MANAGER") {
    filter = {
      status: { $in: ["PENDING", "IN_REVIEW"] },
      currentStep: "MANAGER",
    };
  } else if (user.role === "PIMPINAN") {
    filter = {
      status: { $in: ["PENDING", "IN_REVIEW"] },
      currentStep: "PIMPINAN",
    };
  } else if (user.role === "HR") {
    filter = {
      status: { $in: ["PENDING", "IN_REVIEW"] },
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
      populate: { path: "roleId", select: "name" },
    })
    .sort({ createdAt: -1 });
};

/* =========================
   EDIT + UPDATE
========================= */
export const updateTripService = async ({ id, userId, body }) => {
  const trip = await BusinessTrip.findOne({ _id: id, userId });

  if (!trip) throw new Error("NOT_FOUND");

  if (trip.status !== "PENDING" && trip.status !== "REJECTED") {
    throw new Error("LOCKED");
  }

  let {
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

  budget = Number(budget);

  if (!Array.isArray(timeline)) {
    timeline = timeline ? [timeline] : [];
  }

  const normalizedTimeline = timeline.map((t, i) => ({
    address: typeof t === "string" ? t : t.address,
    order: i + 1,
  }));

  await BusinessTrip.findByIdAndUpdate(id, {
    title,
    purpose,
    startDate,
    endDate,
    destination,
    description,
    budget,
    contactPerson,
    timeline: normalizedTimeline,
  });

  return true;
};

/* =========================
   APPROVAL ACTION
========================= */
export const handleApprovalService = async ({ id, user, action, note }) => {
  const trip = await BusinessTrip.findById(id);

  if (!trip) throw new Error("NOT_FOUND");

  const role = user.role;
  const currentStep = trip.currentStep;

  const isManager = role === "MANAGER";
  const isPimpinan = role === "PIMPINAN";

  const isHRDelegated =
    role === "HR" && currentStep === "PIMPINAN" && trip.delegation?.active === true;

  if (currentStep === "MANAGER" && !isManager) {
    throw new Error("MANAGER_ONLY");
  }

  if (currentStep === "PIMPINAN" && !isPimpinan && !isHRDelegated) {
    throw new Error("PIMPINAN_ONLY");
  }

  if (action === "DELEGATE_TO_HR") {
    if (!isPimpinan) throw new Error("ONLY_PIMPINAN_DELEGATE");

    trip.delegation = {
      from: "PIMPINAN",
      to: "HR",
      active: true,
      createdBy: user._id,
      createdAt: new Date(),
      note: note || "Delegasi approval ke HR",
    };

    await trip.save();
    return { message: "Delegated" };
  }

  if (action === "REJECT") {
    if (!note || note.trim().length < 5) {
      throw new Error("REJECT_NOTE");
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
    trip.delegation.active = false;

    await trip.save();
    return { message: "Rejected" };
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
    } else {
      trip.currentStep = null;
      trip.status = "APPROVED";
      trip.delegation.active = false;
    }

    await trip.save();
    return { message: "Approved" };
  }

  throw new Error("INVALID_ACTION");
};

/* =========================
   FINANCE
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
  return true;
};
