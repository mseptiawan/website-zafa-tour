import BusinessTrip from "../models/BusinessTrip.js";

const create = async ({ body, user }) => {
  let { title, purpose, startDate, endDate, destination, description, budget, meetWith, timeline } =
    body;

  if (!user) throw new Error("Session tidak valid");

  title = title?.trim();
  destination = destination?.trim();
  description = description?.trim();
  budget = Number(budget);

  if (!Array.isArray(timeline)) {
    timeline = timeline ? [timeline] : [];
  }

  const normalizedTimeline = timeline
    .map((t, i) => ({
      address: typeof t === "string" ? t : t?.address,
      order: i + 1,
    }))
    .filter((t) => t.address);

  if (!title || title.length < 5) throw new Error("Judul minimal 5 karakter");

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start) || isNaN(end) || start > end) throw new Error("Tanggal tidak valid");

  if (!destination || destination.length < 3) throw new Error("Destination tidak valid");

  if (!description || description.length < 10) throw new Error("Deskripsi terlalu pendek");

  if (isNaN(budget) || budget < 0) throw new Error("Budget tidak valid");

  if (normalizedTimeline.length === 0) throw new Error("Timeline wajib diisi");

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
    delegation: { active: false },
  });

  return trip;
};

// FIND
const findMine = (userId) => BusinessTrip.find({ userId }).sort({ createdAt: -1 });

const findByIdForOwner = async ({ id, userId }) => {
  const trip = await BusinessTrip.findOne({ _id: id, userId });

  if (!trip) throw new Error("Data tidak ditemukan");

  if (trip.status !== "PENDING" && trip.status !== "REJECTED") {
    throw new Error("Tidak bisa edit saat sudah diproses");
  }

  return trip;
};

// UPDATE
const update = async ({ id, user, body }) => {
  const trip = await BusinessTrip.findOne({
    _id: id,
    userId: user._id,
  });

  if (!trip) throw new Error("Not found");

  if (trip.status !== "PENDING" && trip.status !== "REJECTED") {
    throw new Error("Tidak bisa edit setelah approval");
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

  if (!Array.isArray(timeline)) timeline = timeline ? [timeline] : [];

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
    status: "PENDING",
    currentStep: "MANAGER",
    updatedAt: new Date(),
  });
};

// APPROVAL PAGE
const approvalPage = async (user) => {
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

  const trips = await BusinessTrip.find(filter).populate("userId");

  return { trips, user };
};

// APPROVAL ACTION
const handleApproval = async ({ id, user, body }) => {
  const { action, note } = body;

  const trip = await BusinessTrip.findById(id);
  if (!trip) throw new Error("Not found");

  if (action === "APPROVE") {
    trip.approvals.push({
      role: trip.currentStep,
      actingAs: user.role,
      userId: user._id,
      status: "APPROVED",
      date: new Date(),
    });

    if (trip.currentStep === "MANAGER") {
      trip.currentStep = "PIMPINAN";
      trip.status = "IN_REVIEW";
    } else {
      trip.currentStep = null;
      trip.status = "APPROVED";
    }

    await trip.save();
    return { message: "Approved" };
  }

  if (action === "REJECT") {
    if (!note || note.length < 5) throw new Error("Note minimal 5 karakter");

    trip.approvals.push({
      role: trip.currentStep,
      actingAs: user.role,
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
    trip.delegation = {
      from: "PIMPINAN",
      to: "HR",
      active: true,
      createdAt: new Date(),
    };

    await trip.save();
    return { message: "Delegated" };
  }

  throw new Error("Invalid action");
};

// DELEGATION
const delegateToHR = async ({ id, user }) => {
  if (user.role !== "PIMPINAN") throw new Error("Forbidden");

  const trip = await BusinessTrip.findById(id);
  if (!trip) throw new Error("Not found");

  trip.delegation = {
    from: "PIMPINAN",
    to: "HR",
    active: true,
    createdAt: new Date(),
  };

  await trip.save();
};

// REPORT
const report = async (user) => {
  const filter = user.role === "KARYAWAN" ? { userId: user._id } : {};

  const trips = await BusinessTrip.find(filter).populate("userId");

  return { trips, user };
};

// FINANCE
const findApprovedForFinance = () => BusinessTrip.find({ status: "APPROVED" }).populate("userId");

//PAYMENT
const confirmPayment = async ({ id, user }) => {
  const trip = await BusinessTrip.findById(id);
  if (!trip) throw new Error("Not found");

  trip.paymentStatus = "PAID";
  trip.paidAt = new Date();
  trip.paidBy = user._id;

  await trip.save();
};

// HISTORY
const paymentHistory = async (user) => {
  const trips = await BusinessTrip.find({ status: "APPROVED" })
    .populate("userId")
    .populate("paidBy");

  return { trips, user };
};

export default {
  create,
  findMine,
  findByIdForOwner,
  update,
  approvalPage,
  handleApproval,
  delegateToHR,
  report,
  findApprovedForFinance,
  confirmPayment,
  paymentHistory,
};
