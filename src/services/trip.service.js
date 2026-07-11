import Employee from "../models/employee/Employee.model.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.js";
import Bidang from "../models/basic/Bidang.model.js";
import BusinessTrip from "../models/BusinessTrip.model.js";
import mongoose from "mongoose";
import User from "../models/basic/User.model.js";
import Role from "../models/basic/Role.model.js";
import notificationService from "./notification.service.js";
import { MODULES, NOTIF_CATEGORIES } from "../config/constants.js";

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

  const totalBudget = normalizedBudgetItems.reduce((sum, item) => sum + item.allocatedAmount, 0);
  return { total: totalBudget, items: normalizedBudgetItems };
};
export const createTripService = async ({ user, body }) => {
  if (!user) {
    const err = new Error("Session tidak valid");
    err.status = 401;
    throw err;
  }

  let { title, purpose, startDate, endDate, destination, description, budget, meetWith, timeline } =
    body;
  const userRole = (user.role || "").toUpperCase().trim();

  let newTrip;

  if (userRole === "WAKIL_DIREKTUR" || userRole === "DIREKTUR_UTAMA") {
    if (!title || title.trim().length < 5) throw new Error("Judul minimal 5 karakter");

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || start > end) throw new Error("Rentang tanggal tidak valid");
    if (!destination || destination.trim().length < 3) throw new Error("Destinasi tidak valid");

    if (!Array.isArray(timeline)) timeline = timeline ? [timeline] : [];
    const normalizedTimeline = timeline
      .map((t, index) => ({
        address: typeof t === "string" ? t : t?.address?.trim?.(),
        order: index + 1,
      }))
      .filter((t) => t.address);
    if (normalizedTimeline.length === 0) throw new Error("Timeline rute perjalanan wajib diisi");

    const processedBudget = parseAndValidateBudget(budget);
    const initialStep = userRole === "WAKIL_DIREKTUR" ? "DIREKTUR_UTAMA" : "MANAGER_KEUANGAN";
    const initialStatus = "IN_REVIEW";

    newTrip = await BusinessTrip.create({
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
      status: initialStatus,
      currentStep: initialStep,
      approvals: [],
    });
  } else {
    const employee = await Employee.findOne({ userId: user._id });
    if (!employee) {
      const err = new Error("Data karyawan pengaju tidak ditemukan");
      err.status = 400;
      throw err;
    }

    const career = await EmployeeCareer.findOne({ employee_id: employee._id });
    if (!career) {
      const err = new Error("Data karier karyawan tidak ditemukan");
      err.status = 400;
      throw err;
    }

    if (!career.bidangId) {
      const err = new Error("Akun Anda belum ditempatkan di bidang manapun. Hubungi HRD.");
      err.status = 400;
      throw err;
    }

    const bidang = await Bidang.findById(career.bidangId).populate("managerRoleId");
    if (!bidang) {
      const err = new Error("Data Bidang tidak ditemukan di database");
      err.status = 400;
      throw err;
    }

    if (!bidang.managerRoleId) {
      const err = new Error(`Manager bidang untuk divisi '${bidang.name}' belum dikonfigurasi`);
      err.status = 400;
      throw err;
    }

    const managerRole = (bidang.managerRoleId.name || "").toUpperCase().trim();

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
    if (isNaN(start) || isNaN(end) || start > end) throw new Error("Rentang tanggal tidak valid");
    if (!destination || destination.trim().length < 3) throw new Error("Destinasi tidak valid");
    if (normalizedTimeline.length === 0) throw new Error("Timeline rute perjalanan wajib diisi");

    let initialStep = managerRole;
    let initialStatus = "PENDING";

    if (userRole === managerRole) {
      initialStep = "DIREKTUR_UTAMA";
      initialStatus = "IN_REVIEW";
    }

    newTrip = await BusinessTrip.create({
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
      status: initialStatus,
      currentStep: initialStep,
      approvals: [],
    });
  }

  try {
    const targetRoleName = newTrip.currentStep;

    if (targetRoleName) {
      const targetRole = await Role.findOne({
        name: { $regex: new RegExp(`^${targetRoleName.replace(/_/g, "[-_ ]?")}$`, "i") },
      }).lean();

      if (targetRole) {
        let reviewers = await User.find({ roleId: targetRole._id }).select("_id").lean();

        if (reviewers.length === 0) {
          reviewers = await User.find({ role: targetRole.name }).select("_id").lean();
        }

        const reviewerUserIds = reviewers.map((rev) => rev._id);

        if (reviewerUserIds.length > 0) {
          await notificationService.createManyNotifications({
            userIds: reviewerUserIds,
            senderId: user._id,
            senderName: user.username,
            title: "Pengajuan Dinas Baru",
            text: `${user.username} mengajukan permohonan dinas luar: ${newTrip.title}.`,
            module: MODULES.TRIP || "TRIP",
            referenceId: newTrip._id,
            actionUrl: `/trip/detail/${newTrip._id}`,
            type: "TRIP",
            category: NOTIF_CATEGORIES.INFO,
          });
        }
      }
    }
  } catch (notifError) {
    console.error("Gagal mengirim notifikasi trip:", notifError.message);
  }

  return newTrip;
};
export const getApprovalTripsService = async (user) => {
  const role = (user.role || "").toUpperCase().trim();

  let targetStep = "";
  if (role === "DIREKTUR_UTAMA" || role === "MANAGER_KEUANGAN") {
    targetStep = role;
  } else {
    const employee = await Employee.findOne({ userId: user._id });
    if (!employee) return [];
    const career = await EmployeeCareer.findOne({ employee_id: employee._id });
    if (!career) return [];
    const bidang = await Bidang.findById(career.bidangId).populate("managerRoleId");
    if (!bidang?.managerRoleId) return [];
    targetStep = bidang.managerRoleId.name;
  }

  const activeTrips = await BusinessTrip.find({
    status: { $in: ["PENDING", "IN_REVIEW"] },
    currentStep: targetStep,
  }).populate("userId", "username");

  const historyTrips = await BusinessTrip.find({
    status: { $in: ["APPROVED", "REJECTED"] },
    "approvals.actor": role,
  }).populate("userId", "username");

  return [...activeTrips, ...historyTrips];
};

export const handleApprovalService = async ({ id, user, action, note, file }) => {
  const trip = await BusinessTrip.findById(id).populate("userId");
  if (!trip) {
    const err = new Error("Data pengaju dinas luar tidak ditemukan");
    err.status = 404;
    throw err;
  }

  if (["APPROVED", "REJECTED"].includes(trip.status)) {
    const err = new Error("Proses dokumen ini sudah selesai dan tidak bisa diubah kembali");
    err.status = 400;
    throw err;
  }

  const step = trip.currentStep;
  const hasPassedDirut = trip.approvals.some(
    (approval) => approval.step === "DIREKTUR_UTAMA" && approval.status === "APPROVED"
  );

  const requesterId = trip.userId?._id || trip.userId;

  if (action === "APPROVE") {
    if (step === "MANAGER_KEUANGAN" && hasPassedDirut) {
      if (!file) {
        const err = new Error("Bukti pencairan anggaran/transfer wajib diunggah oleh Keuangan");
        err.status = 400;
        throw err;
      }
      trip.payment = {
        proofUrl: file.filename,
        paidAt: new Date(),
        paidBy: user._id,
        note: note || "Pencairan dana berhasil diproses.",
      };
    }

    trip.approvals.push({
      step,
      actor: user.role,
      userId: user._id,
      status: "APPROVED",
      date: new Date(),
      note: note || null,
      attachedFile: file ? file.filename : null,
    });

    if (step === "MANAGER_KEUANGAN" && hasPassedDirut) {
      trip.currentStep = null;
      trip.status = "APPROVED";
    } else if (step === "DIREKTUR_UTAMA") {
      trip.currentStep = "MANAGER_KEUANGAN";
      trip.status = "IN_REVIEW";
    } else {
      trip.currentStep = "DIREKTUR_UTAMA";
      trip.status = "IN_REVIEW";
    }

    await trip.save();

    // ==========================================
    // ALUR DISTRIBUSI NOTIFIKASI UNTUK APPROVE
    // ==========================================
    try {
      if (trip.status === "APPROVED") {
        await notificationService.createNotification({
          userId: requesterId,
          senderId: user._id,
          senderName: user.username,
          title: "Status Dinas Luar: APPROVED",
          text: `Pengajuan dinas "${trip.title}" telah disetujui sepenuhnya oleh Keuangan.`,
          module: MODULES.TRIP || "TRIP",
          referenceId: trip._id,
          actionUrl: `/trip/detail/${trip._id}`,
          type: "TRIP",
          category: NOTIF_CATEGORIES.INFO,
        });
      } else if (trip.currentStep) {
        const nextRoleName = trip.currentStep;
        const targetRole = await Role.findOne({
          name: { $regex: new RegExp(`^${nextRoleName.replace(/_/g, "[-_ ]?")}$`, "i") },
        }).lean();

        if (targetRole) {
          let reviewers = await User.find({ roleId: targetRole._id }).select("_id").lean();
          if (reviewers.length === 0) {
            reviewers = await User.find({ role: targetRole.name }).select("_id").lean();
          }

          const reviewerUserIds = reviewers.map((rev) => rev._id);

          if (reviewerUserIds.length > 0) {
            await notificationService.createManyNotifications({
              userIds: reviewerUserIds,
              senderId: user._id,
              senderName: user.username,
              title: "Persetujuan Dinas Luar Baru",
              text: `Mohon tinjau pengajuan dinas luar dari ${trip.userId?.username || "Karyawan"}: ${trip.title}.`,
              module: MODULES.TRIP || "TRIP",
              referenceId: trip._id,
              actionUrl: `/trip/detail/${trip._id}`,
              type: "TRIP",
              category: NOTIF_CATEGORIES.INFO,
            });
          }
        }
      }
    } catch (notifError) {
      console.error("Gagal mengirim notifikasi berantai approve:", notifError.message);
    }

    return { message: "Pengajuan berhasil disetujui" };
  }

  if (action === "REJECT") {
    if (!note || note.trim().length < 5) {
      const err = new Error("Alasan penolakan wajib diisi minimal 5 karakter");
      err.status = 400;
      throw err;
    }

    trip.approvals.push({
      step,
      actor: user.role,
      userId: user._id,
      status: "REJECTED",
      date: new Date(),
      note,
    });

    trip.status = "REJECTED";
    trip.currentStep = null;

    await trip.save();

    // ==========================================
    // ALUR DISTRIBUSI NOTIFIKASI UNTUK REJECT
    // ==========================================
    try {
      await notificationService.createNotification({
        userId: requesterId,
        senderId: user._id,
        senderName: user.username,
        title: "Status Dinas Luar: REJECTED",
        text: `Pengajuan dinas "${trip.title}" telah ditolak oleh ${user.role}. Alasan: "${note}"`,
        module: MODULES.TRIP || "TRIP",
        referenceId: trip._id,
        actionUrl: `/trip/detail/${trip._id}`,
        type: "TRIP",
        category: NOTIF_CATEGORIES.INFO,
      });
    } catch (notifError) {
      console.error("Gagal mengirim notifikasi penolakan trip:", notifError.message);
    }

    return { message: "Pengajuan resmi ditolak" };
  }

  const err = new Error("Aksi approval tidak valid");
  err.status = 400;
  throw err;
};
export const getTripDetailService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("INVALID_ID");
  const trip = await BusinessTrip.findById(id).populate({
    path: "userId",
    select: "username",
  });
  if (!trip) throw new Error("NOT_FOUND");
  return trip;
};

export const getEditableTripService = async (tripId, sessionUserId) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) throw new Error("INVALID_ID");
  const trip = await BusinessTrip.findById(tripId).lean();
  if (!trip) throw new Error("NOT_FOUND");
  if (trip.userId.toString() !== sessionUserId.toString()) throw new Error("FORBIDDEN");
  if (trip.status !== "PENDING") throw new Error("FORBIDDEN");
  return trip;
};

export const editTripService = async (tripId, sessionUserId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(tripId)) throw new Error("INVALID_ID");
  const trip = await BusinessTrip.findById(tripId);
  if (!trip) throw new Error("NOT_FOUND");
  if (trip.userId.toString() !== sessionUserId.toString()) throw new Error("FORBIDDEN");
  if (trip.status !== "PENDING") throw new Error("FORBIDDEN");

  let totalBudget = 0;
  let items = [];

  if (updateData.budget && updateData.budget.items) {
    const rawItems = Array.isArray(updateData.budget.items)
      ? updateData.budget.items
      : Object.values(updateData.budget.items);

    items = rawItems.map((item) => {
      const qty = Number(item.quantity) || 1;
      const price =
        typeof item.pricePerUnit === "string"
          ? Number(item.pricePerUnit.replace(/\D/g, ""))
          : Number(item.pricePerUnit) || 0;
      const allocated = qty * price;
      totalBudget += allocated;

      return {
        title: item.title,
        quantity: qty,
        unit: item.unit || "Hari",
        pricePerUnit: price,
        allocatedAmount: allocated,
        description: item.description || "",
      };
    });
  }

  let timeline = [];
  if (updateData.timeline) {
    const rawTimeline = Array.isArray(updateData.timeline)
      ? updateData.timeline
      : Object.values(updateData.timeline);
    timeline = rawTimeline
      .filter((tl) => tl.address && tl.address.trim() !== "")
      .map((tl, index) => ({
        address: tl.address,
        order: index + 1,
      }));
  }

  trip.title = updateData.title;
  trip.purpose = updateData.purpose;
  trip.meetWith = updateData.meetWith;
  trip.startDate = new Date(updateData.startDate);
  trip.endDate = new Date(updateData.endDate);
  trip.destination = updateData.destination;
  trip.description = updateData.description;
  trip.budget = { total: totalBudget, items: items };
  trip.timeline = timeline;

  await trip.save();
  return trip;
};
