import Employee from "../models/employee/Employee.model.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.js";
import Bidang from "../models/basic/Bidang.model.js";
import BusinessTrip from "../models/BusinessTrip.model.js";
import Role from "../models/basic/Role.model.js";
import User from "../models/basic/User.model.js";
import mongoose from "mongoose";

export const attachEmployeeName = async (docs) => {
  const employees = await Employee.find().select("userId fullName");
  const map = new Map(employees.map((e) => [e.userId?.toString(), e.fullName]));
  return docs.map((d) => ({
    ...d.toObject(),
    fullName: map.get(d.userId?.toString()) || "-",
  }));
};

const parseAndValidateBudget = (budgetData) => {
  let budgetItems = budgetData?.items;
  if (!Array.isArray(budgetItems)) {
    budgetItems = budgetItems ? [budgetItems] : [];
  }

  const normalizedBudgetItems = budgetItems
    .map((item) => {
      const quantity = Number(item?.quantity || 1);
      const pricePerUnit = Number(item?.pricePerUnit || 0);
      return {
        title: item?.title?.trim(),
        quantity,
        unit: item?.unit?.trim() || "Hari",
        pricePerUnit,
        allocatedAmount: quantity * pricePerUnit, 
        description: item?.description?.trim() || "",
      };
    })
    .filter((item) => item.title);

  if (normalizedBudgetItems.length === 0) {
    const err = new Error("Rincian budget wajib diisi minimal 1 item");
    err.status = 400;
    throw err;
  }

  const isBudgetInvalid = normalizedBudgetItems.some(
    (item) =>
      isNaN(item.quantity) ||
      item.quantity <= 0 ||
      isNaN(item.pricePerUnit) ||
      item.pricePerUnit < 0
  );

  if (isBudgetInvalid) {
    const err = new Error("Kuantitas atau nominal harga unit budget tidak valid / bernilai minus");
    err.status = 400;
    throw err;
  }

  const totalBudget = normalizedBudgetItems.reduce((sum, item) => sum + item.allocatedAmount, 0);

  return {
    total: totalBudget,
    items: normalizedBudgetItems,
  };
};

export const createTripService = async ({ user, body }) => {
  if (!user) {
    const err = new Error("Session tidak valid");
    err.status = 401;
    throw err;
  }

  let { title, purpose, startDate, endDate, destination, description, budget, meetWith, timeline } =
    body;

  const employee = await Employee.findOne({ userId: user._id });
  if (!employee) {
    const err = new Error("Employee tidak ditemukan");
    err.status = 400;
    throw err;
  }

  const career = await EmployeeCareer.findOne({ employee_id: employee._id });
  if (!career) {
    const err = new Error("Career tidak ditemukan");
    err.status = 400;
    throw err;
  }

  const bidang = await Bidang.findById(career.bidangId).populate("managerRoleId");
  if (!bidang || !bidang.managerRoleId) {
    const err = new Error("Manager bidang belum diset");
    err.status = 400;
    throw err;
  }

  const managerRole = bidang.managerRoleId.name;

  if (!Array.isArray(timeline)) timeline = timeline ? [timeline] : [];
  const normalizedTimeline = timeline
    .map((t, index) => ({
      address: typeof t === "string" ? t : t?.address?.trim?.(),
      order: index + 1,
    }))
    .filter((t) => t.address);

  const processedBudget = parseAndValidateBudget(budget);

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (!title || title.trim().length < 5) throw new Error("Judul minimal 5 karakter");
  if (isNaN(start) || isNaN(end) || start > end) throw new Error("Tanggal tidak valid");
  if (!destination || destination.trim().length < 3) throw new Error("Destination tidak valid");
  if (normalizedTimeline.length === 0) throw new Error("Timeline wajib diisi");

  return await BusinessTrip.create({
    userId: user._id,
    requesterRole: user.role,
    title: title.trim(),
    purpose,
    startDate: start,
    endDate: end,
    destination: destination.trim(),
    description: description?.trim(),
    meetWith,
    timeline: normalizedTimeline,
    budget: processedBudget,
    status: "PENDING",
    currentStep: managerRole,
    approvals: [],
  });
};

export const getMyTripsService = async (userId) => {
  return await BusinessTrip.find({ userId }).sort({ createdAt: -1 });
};

export const getTripDetailService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("INVALID_ID");
  const trip = await BusinessTrip.findById(id).populate({
    path: "userId",
    select: "username roleId",
    populate: { path: "roleId", select: "name" },
  });
  if (!trip) throw new Error("NOT_FOUND");
  return trip;
};

export const getApprovalTripsService = async (user) => {
  const role = (user.role || "").toUpperCase();
  const baseFilter = { status: { $in: ["PENDING", "IN_REVIEW"] } };

  if (role === "DIREKTUR_UTAMA") {
    baseFilter.currentStep = "DIREKTUR_UTAMA";
    return await BusinessTrip.find(baseFilter).populate("userId", "username");
  }

  if (role === "WAKIL_DIREKTUR") {
    baseFilter.$or = [
      { currentStep: "WAKIL_DIREKTUR" },
      {
        currentStep: "DIREKTUR_UTAMA",
        "delegation.active": true,
        "delegation.to": "WAKIL_DIREKTUR",
      },
    ];
    return await BusinessTrip.find(baseFilter).populate("userId", "username");
  }

  const employee = await Employee.findOne({ userId: user._id });
  if (!employee) return [];
  const career = await EmployeeCareer.findOne({ employee_id: employee._id });
  if (!career) return [];
  const bidang = await Bidang.findById(career.bidangId).populate("managerRoleId");
  if (!bidang?.managerRoleId) return [];

  baseFilter.currentStep = bidang.managerRoleId.name;
  return await BusinessTrip.find(baseFilter).populate("userId", "username");
};

const editableStatuses = ["PENDING", "REJECTED"];

export const getEditableTripService = async (id, userId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("INVALID_ID");
  const trip = await BusinessTrip.findOne({ _id: id, userId });
  if (!trip) throw new Error("NOT_FOUND");
  if (!editableStatuses.includes(trip.status)) throw new Error("FORBIDDEN");
  return trip;
};

export const updateTripService = async (id, userId, body) => {
  const trip = await getEditableTripService(id, userId);
  if (trip.status !== "PENDING") throw new Error("FORBIDDEN");

  const processedBudget = parseAndValidateBudget(body.budget);
  Object.assign(trip, {
    title: body.title,
    destination: body.destination,
    description: body.description,
    meetWith: body.meetWith,
    startDate: body.startDate,
    endDate: body.endDate,
    budget: processedBudget,
  });

  await trip.save();
  return trip;
};

export const resubmitTripService = async (id, userId, body) => {
  const trip = await getEditableTripService(id, userId);
  if (trip.status !== "REJECTED") throw new Error("FORBIDDEN");

  const processedBudget = parseAndValidateBudget(body.budget);
  Object.assign(trip, {
    title: body.title,
    destination: body.destination,
    description: body.description,
    meetWith: body.meetWith,
    startDate: body.startDate,
    endDate: body.endDate,
    budget: processedBudget,
  });

  const lastRejected = [...trip.approvals].reverse().find((a) => a.status === "REJECTED");
  if (!lastRejected) throw new Error("REJECT_HISTORY_NOT_FOUND");

  const isHRFlow =
    trip.delegation?.active === true &&
    trip.delegation?.to === "WAKIL_DIREKTUR" &&
    lastRejected.actor === "WAKIL_DIREKTUR";

  trip.approvals = [];
  trip.status = "IN_REVIEW";

  if (isHRFlow) {
    trip.currentStep = "DIREKTUR_UTAMA";
    trip.delegation.active = true;
  } else if (
    lastRejected.step === "DIREKTUR_UTAMA" ||
    lastRejected.step === "MANAGER_ADMINISTRASI"
  ) {
    trip.currentStep = lastRejected.step;
    trip.status = lastRejected.step === "MANAGER_ADMINISTRASI" ? "PENDING" : "IN_REVIEW";
    trip.delegation.active = false;
  } else {
    throw new Error("INVALID_WORKFLOW_STATE");
  }

  await trip.save();
  return trip;
};

export const handleApprovalService = async ({ id, user, action, note }) => {
  const trip = await BusinessTrip.findById(id).populate("userId");
  if (!trip) {
    const err = new Error("Data tidak ditemukan");
    err.status = 404;
    throw err;
  }

  const employee = await Employee.findOne({ userId: trip.userId._id });
  if (!employee) {
    const err = new Error("Employee tidak ditemukan");
    err.status = 400;
    throw err;
  }
  const career = await EmployeeCareer.findOne({ employee_id: employee._id });
  if (!career) {
    const err = new Error("Career tidak ditemukan");
    err.status = 400;
    throw err;
  }
  const bidang = await Bidang.findById(career.bidangId).populate("managerRoleId");
  if (!bidang || !bidang.managerRoleId) {
    const err = new Error("Manager bidang belum diset");
    err.status = 400;
    throw err;
  }

  const managerRole = bidang.managerRoleId.name;
  const step = trip.currentStep;

  if (["APPROVED", "REJECTED", "PAID"].includes(trip.status)) {
    const err = new Error("Approval sudah selesai");
    err.status = 400;
    throw err;
  }

  const effectiveActor =
    trip.delegation?.active && step === "DIREKTUR_UTAMA" && user.role === "WAKIL_DIREKTUR"
      ? "WAKIL_DIREKTUR"
      : user.role;

  if (action === "APPROVE") {
    trip.approvals.push({
      step,
      actor: effectiveActor,
      userId: user._id,
      status: "APPROVED",
      date: new Date(),
      note: note || null,
    });

    if (step === managerRole) {
      trip.currentStep = "DIREKTUR_UTAMA";
      trip.status = "IN_REVIEW";
    } else if (step === "DIREKTUR_UTAMA") {
      trip.status = "APPROVED";
      trip.currentStep = null;
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
  if (trip.status !== "IN_REVIEW" || trip.currentStep !== "DIREKTUR_UTAMA") {
    const err = new Error("Delegasi hanya saat tahap pimpinan");
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
