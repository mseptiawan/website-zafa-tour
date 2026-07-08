import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import { PAGINATION, MODULES, NOTIF_CATEGORIES } from "../config/constants.js";
import Resignation from "../models/Resignation.model.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.js";
import User from "../models//basic/User.model.js";
import Employee from "../models/employee/Employee.model.js";
import notificationService from "./notification.service.js";

export const createSubmission = async ({ body, employeeId }) => {
  if (!employeeId) {
    const err = new Error("Profil karyawan tidak valid.");
    err.statusCode = 400;
    throw err;
  }

  const existingPending = await Resignation.findOne({
    employee_id: employeeId,
    status: { $in: ["PENDING_WADIR", "PENDING_DIRUT"] },
  });

  if (existingPending) {
    const err = new Error("Anda masih memiliki pengajuan aktif yang sedang diproses.");
    err.statusCode = 400;
    throw err;
  }

  const resignation = await Resignation.create({
    employee_id: employeeId,
    effective_date: body.effective_date,
    reason: body.reason,
    status: "PENDING_WADIR",
  });

  try {
    const wadirUsers = await Employee.find({ role: "WAKIL_DIREKTUR" }).select("userId").lean();
    const targetUserIds = wadirUsers.map((w) => w.userId).filter((id) => id != null);

    if (targetUserIds.length > 0) {
      await notificationService.createManyNotifications({
        userIds: targetUserIds,
        senderId: resignation._id,
        senderName: "Sistem HRIS",
        title: "Pengajuan Resign Baru",
        text: "Terdapat dokumen pengunduran diri baru yang membutuhkan verifikasi Anda.",
        module: MODULES.RESIGNATION || "RESIGNATION",
        referenceId: resignation._id,
        actionUrl: `/resignation/${resignation._id}`,
        type: "RESIGNATION",
        category: NOTIF_CATEGORIES.INFO,
      });
    }
  } catch (notifError) {
    console.error("ERROR NOTIFIKASI RESIGN:", notifError.message);
  }

  return resignation;
};

export const findMine = async ({ employeeId, page, limit }) => {
  if (!employeeId) {
    return {
      data: [],
      meta: getPaginationMeta({ page: 1, limit: PAGINATION.DEFAULT_LIMIT, total: 0 }),
    };
  }

  const paginationArgs = getPagination({ page, limit });
  const filter = { employee_id: employeeId };
  const total = await Resignation.countDocuments(filter);

  const data = await Resignation.find(filter)
    .populate("employee_id") // 🔥 Tambahkan populate di sini
    .sort({ createdAt: -1 })
    .skip(paginationArgs.skip)
    .limit(paginationArgs.limit)
    .lean();

  return {
    data,
    meta: getPaginationMeta({ page: paginationArgs.page, limit: paginationArgs.limit, total }),
  };
};
export const findAllPending = async ({ page = 1, limit = PAGINATION.DEFAULT_LIMIT, currentUser }) => {
  const paginationArgs = getPagination({ page, limit });
  const filter = {};
  const role = currentUser?.role?.toUpperCase();

  if (role === "WAKIL_DIREKTUR") {
    filter.status = { $in: ["PENDING_WADIR", "PENDING_DIRUT", "REJECTED_WADIR"] };
  } else if (role === "DIREKTUR_UTAMA") {
    filter.status = { $in: ["PENDING_DIRUT", "APPROVED", "REJECTED_DIRUT"] };
  }

  if (currentUser?.employeeId) {
    filter.employee_id = { $ne: currentUser.employeeId };
  }

  const total = await Resignation.countDocuments(filter);

  const data = await Resignation.find(filter)
    .populate({ 
      path: "employee_id", 
      select: "fullName employeeIdNumber careerData" 
    })
    .sort({ createdAt: -1 })
    .skip(paginationArgs.skip)
    .limit(paginationArgs.limit)
    .lean();

  return {
    data,
    meta: getPaginationMeta({ page: paginationArgs.page, limit: paginationArgs.limit, total }),
  };
};
export const findById = async (id) => {
  return await Resignation.findById(id)
    .populate([
      { path: "employee_id" },
      { path: "approvals.wadir.approved_by", select: "username email" },
      { path: "approvals.dirut.approved_by", select: "username email" }
    ])
    .lean();
};

export const processWadirApproval = async ({ resignationId, userId, action, note }) => {
  const status = action === "APPROVE" ? "PENDING_DIRUT" : "REJECTED_WADIR";

  const resignation = await Resignation.findByIdAndUpdate(
    resignationId,
    {
      status,
      $set: {
        "approvals.wadir": {
          approved_by: userId,
          approved_at: new Date(),
          note: note || "",
        },
      },
    },
    { new: true }
  );

  if (status === "PENDING_DIRUT") {
    try {
      const dirutUsers = await Employee.find({ role: "DIREKTUR_UTAMA" }).select("userId").lean();
      const targetUserIds = dirutUsers.map((d) => d.userId).filter((id) => id != null);

      if (targetUserIds.length > 0) {
        await notificationService.createManyNotifications({
          userIds: targetUserIds,
          senderId: userId,
          senderName: "Wakil Direktur",
          title: "Persetujuan Resign Tahap 1",
          text: "Berkas pengunduran diri telah disetujui Wadir dan menunggu keputusan final Anda.",
          module: MODULES.RESIGNATION || "RESIGNATION",
          referenceId: resignation._id,
          actionUrl: `/resignation/${resignation._id}`,
          type: "RESIGNATION",
          category: NOTIF_CATEGORIES.INFO,
        });
      }
    } catch (notifError) {
      console.error("ERROR NOTIFIKASI WADIR APPROVAL:", notifError.message);
    }
  }

  return resignation;
};
export const processFinalApproval = async ({ resignationId, userId, action, note, attachment }) => {
  const status = action === "APPROVE" ? "APPROVED" : "REJECTED_DIRUT";

  const updateData = {
    $set: {
      status: status,
      "approvals.dirut": {
        approved_by: userId,
        approved_at: new Date(),
        note: note || "",
      },
    },
  };

  if (status === "APPROVED" && attachment) {
    updateData.$set.attachment = attachment;
  }

  const resignation = await Resignation.findByIdAndUpdate(
    resignationId,
    updateData,
    { new: true }
  );

  if (status === "APPROVED") {
    await EmployeeCareer.findOneAndUpdate(
      { employee_id: resignation.employee_id },
      { status_pegawai: "Resign" }
    );

    const employeeData = await Employee.findById(resignation.employee_id).lean();
    
    if (employeeData && employeeData.userId) {
      await User.findByIdAndUpdate(employeeData.userId, {
        status: "Inactive"
      });
    }
  }

  return resignation;
};