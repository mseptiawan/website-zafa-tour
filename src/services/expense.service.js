import Expense from "../models/Expense.model.js";
import Employee from "../models/employee/Employee.model.js";
import ExpenseCategory from "../models/ExpenseCategory.model.js";
import Bidang from "../models/basic/Bidang.model.js";
import ExpenseLog from "../models/ExpenseLog.model.js";
import User from "../models/basic/User.model.js";
import Role from "../models/basic/Role.model.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import { MODULES, NOTIF_CATEGORIES } from "../config/constants.js";
import notificationService from "./notification.service.js";

export const findActiveCategories = async () => {
  return await ExpenseCategory.find({ isActive: true }).sort({ name: 1 }).lean();
};

export const createClaim = async ({ body, file, currentUser }) => {
  const {
    title,
    description,
    category,
    amount,
    expenseDate,
    noReceiptReason,
    selfDeclaration,
    noReceipt,
  } = body;

  const employee = await Employee.findOne({ userId: currentUser._id }).populate("careerData");
  if (!employee) {
    throw new Error("Data profile karyawan Anda tidak ditemukan pada sistem.");
  }

  const isNoReceipt = !!noReceipt;
  const hasFile = !!file;

  if (!isNoReceipt && !hasFile) {
    const error = new Error("Upload bukti transaksi wajib jika nota tersedia.");
    error.statusCode = 400;
    error.field = "proofFile";
    throw error;
  }

  const cleanAmount = Number(amount) || 0;
  let status = "PENDING_FINANCE";
  let approverRoleId = null;

  const userRole = currentUser.role?.toUpperCase();
  const isManagerRole = [
    "MANAGER_KEUANGAN",
    "MANAGER_ADMINISTRASI",
    "MANAGER_HAJI_UMRAH",
    "WAKIL_DIREKTUR",
    "DIREKTUR_UTAMA",
  ].includes(userRole);

  if (cleanAmount > 200000 && !isManagerRole) {
    status = "PENDING_MANAGER";
    const career = employee.careerData;

    if (career && career.bidangId) {
      const bidang = await Bidang.findById(career.bidangId).lean();
      if (bidang && bidang.managerRoleId) {
        approverRoleId = bidang.managerRoleId;
      }
    }

    if (!approverRoleId) {
      throw new Error(
        "Gagal: Bidang kerja atau posisi Manager penanggung jawab Anda tidak ditemukan."
      );
    }
  }

  const expense = await Expense.create({
    userId: currentUser._id,
    employeeId: employee._id,
    title,
    description: description,
    category,
    amount: cleanAmount,
    expenseDate,
    noReceiptReason: isNoReceipt ? noReceiptReason : null,
    selfDeclaration: isNoReceipt ? !!selfDeclaration : false,
    status,
    approverRoleId,
    proofFile: hasFile ? file.filename : null,
  });

  try {
    const formattedAmount = cleanAmount.toLocaleString("id-ID");

    if (status === "PENDING_MANAGER") {
      const managers = await User.find({ roleId: approverRoleId }).select("_id").lean();
      const managerUserIds = managers.map((m) => m._id);

      if (managerUserIds.length > 0) {
        await notificationService.createManyNotifications({
          userIds: managerUserIds,
          senderId: currentUser._id,
          senderName: employee.fullName,
          title: "Persetujuan Klaim Baru",
          text: `${employee.fullName} mengajukan klaim "${title}" sebesar Rp ${formattedAmount}.`,
          module: "EXPENSE",
          referenceId: expense._id,
          actionUrl: `/expense/detail/${expense._id}`,
          type: "EXPENSE",
          category: NOTIF_CATEGORIES.INFO,
        });
      }
    } else if (status === "PENDING_FINANCE") {
      const targetRole = await Role.findOne({ name: "MANAGER_KEUANGAN" }).lean();

      if (targetRole) {
        const financeUsers = await User.find({ roleId: targetRole._id }).select("_id").lean();
        const financeUserIds = financeUsers.map((f) => f._id);

        if (financeUserIds.length > 0) {
          await notificationService.createManyNotifications({
            userIds: financeUserIds,
            senderId: currentUser._id,
            senderName: employee.fullName,
            title: "Antrean Klaim Finansial",
            text: `Klaim operasional baru "${title}" Rp ${formattedAmount} menunggu pencairan dana.`,
            module: "EXPENSE",
            referenceId: expense._id,
            actionUrl: `/expense/detail/${expense._id}`,
            type: "EXPENSE",
            category: NOTIF_CATEGORIES.INFO,
          });
        }
      }
    }
  } catch (notifError) {
    console.error(notifError.message);
  }

  return expense;
};

export const findMyClaims = async ({ userId, page }) => {
  const paginationArgs = getPagination({ page, limit: 10 });
  const filter = { userId };

  const total = await Expense.countDocuments(filter);
  const data = await Expense.find(filter)
    .populate("category")
    .sort({ createdAt: -1 })
    .skip(paginationArgs.skip)
    .limit(paginationArgs.limit)
    .lean();

  return {
    data,
    meta: getPaginationMeta({ page: paginationArgs.page, limit: paginationArgs.limit, total }),
  };
};

export const findManagerApprovals = async ({ roleId, userId, page }) => {
  const paginationArgs = getPagination({ page, limit: 10 });

  const handledLogs = await ExpenseLog.find({ userId }).select("expenseId").lean();
  const handledExpenseIds = handledLogs.map((log) => log.expenseId);

  const filter = {
    $or: [
      { status: "PENDING_MANAGER", approverRoleId: roleId },
      { _id: { $in: handledExpenseIds } },
    ],
  };

  const total = await Expense.countDocuments(filter);
  const data = await Expense.find(filter)
    .populate("employeeId")
    .populate("category")
    .sort({ updatedAt: -1 })
    .skip(paginationArgs.skip)
    .limit(paginationArgs.limit)
    .lean();

  return {
    data,
    meta: getPaginationMeta({ page: paginationArgs.page, limit: paginationArgs.limit, total }),
  };
};

export const processApproval = async ({ id, userId, role, file, note, currentStatus }) => {
  let nextStatus = currentStatus;
  let transferProofFile = null;
  let paidAt = null;

  if (currentStatus === "PENDING_MANAGER") {
    nextStatus = "PENDING_FINANCE";
  } else if (currentStatus === "PENDING_FINANCE") {
    if (!file) {
      const error = new Error("Wajib mengunggah bukti transfer untuk menyelesaikan pembayaran.");
      error.statusCode = 400;
      throw error;
    }
    nextStatus = "PAID";
    transferProofFile = file.filename;
    paidAt = new Date();
  }

  const updateFields = { status: nextStatus };
  if (transferProofFile) updateFields.transferProofFile = transferProofFile;
  if (paidAt) updateFields.paidAt = paidAt;

  const expense = await Expense.findByIdAndUpdate(id, updateFields, { returnDocument: "after" });

  const isFinanceNode =
    typeof role === "string" &&
    role.toUpperCase() === "MANAGER_KEUANGAN" &&
    currentStatus === "PENDING_FINANCE";

  await ExpenseLog.create({
    expenseId: id,
    userId,
    role: isFinanceNode ? "FINANCE" : "MANAGER",
    action: "APPROVED",
    note:
      note ||
      (nextStatus === "PAID" ? "Klaim dicairkan oleh Finance" : "Disetujui oleh Manager Bidang"),
  });

  try {
    const formattedAmount = expense.amount.toLocaleString("id-ID");

    if (nextStatus === "PENDING_FINANCE") {
      const targetRole = await Role.findOne({ name: "MANAGER_KEUANGAN" }).lean();

      if (targetRole) {
        const financeUsers = await User.find({ roleId: targetRole._id }).select("_id").lean();
        const financeUserIds = financeUsers.map((f) => f._id);

        if (financeUserIds.length > 0) {
          await notificationService.createManyNotifications({
            userIds: financeUserIds,
            senderId: userId,
            senderName: "Manager Bidang",
            title: "Tagihan Siap Dicairkan",
            text: `Klaim "${expense.title}" Rp ${formattedAmount} disetujui Manager & diteruskan ke Keuangan.`,
            module: "EXPENSE",
            referenceId: expense._id,
            actionUrl: `/expense/detail/${expense._id}`,
            type: "EXPENSE",
            category: NOTIF_CATEGORIES.INFO,
          });
        }
      }

      await notificationService.createNotification({
        userId: expense.userId,
        senderId: userId,
        senderName: "Manager Bidang",
        title: "Klaim Disetujui Manager",
        text: `Klaim "${expense.title}" telah disetujui dan kini berada dalam antrean Bagian Keuangan.`,
        module: "EXPENSE",
        referenceId: expense._id,
        actionUrl: `/expense/detail/${expense._id}`,
        type: "EXPENSE",
        category: NOTIF_CATEGORIES.INFO,
      });
    } else if (nextStatus === "PAID") {
      await notificationService.createNotification({
        userId: expense.userId,
        senderId: userId,
        senderName: "Bagian Keuangan",
        title: "Dana Klaim Dicairkan 🎉",
        text: `Klaim "${expense.title}" senilai Rp ${formattedAmount} telah ditransfer dan Lunas.`,
        module: "EXPENSE",
        referenceId: expense._id,
        actionUrl: `/expense/detail/${expense._id}`,
        type: "EXPENSE",
        category: NOTIF_CATEGORIES.INFO,
      });
    }
  } catch (notifError) {
    console.error(notifError.message);
  }

  return { expense, nextStatus };
};

export const rejectByManager = async ({ id, userId, role, note }) => {
  const expense = await Expense.findByIdAndUpdate(
    id,
    {
      status: "REJECTED",
    },
    { returnDocument: "after" }
  );

  await ExpenseLog.create({
    expenseId: id,
    userId,
    role,
    action: "REJECTED",
    note: note || "Ditolak oleh Manager Bidang",
  });

  try {
    await notificationService.createNotification({
      userId: expense.userId,
      senderId: userId,
      senderName: "Manager Bidang",
      title: "Klaim Beban Ditolak ❌",
      text: `Pengajuan "${expense.title}" ditolak. Alasan: "${note || "Tidak ada catatan"}"`,
      module: "EXPENSE",
      referenceId: expense._id,
      actionUrl: `/expense/detail/${expense._id}`,
      type: "EXPENSE",
      category: NOTIF_CATEGORIES.INFO,
    });
  } catch (notifError) {
    console.error(notifError.message);
  }

  return expense;
};

export const findFinanceClaims = async ({ page }) => {
  const paginationArgs = getPagination({ page, limit: 10 });
  const filter = { status: { $in: ["PENDING_FINANCE", "PAID"] } };

  const total = await Expense.countDocuments(filter);
  const data = await Expense.find(filter)
    .populate("employeeId")
    .populate("category")
    .sort({ createdAt: -1 })
    .skip(paginationArgs.skip)
    .limit(paginationArgs.limit)
    .lean();

  return {
    data,
    meta: getPaginationMeta({ page: paginationArgs.page, limit: paginationArgs.limit, total }),
  };
};

export const processPayment = async ({ id, userId, file, note }) => {
  const expense = await Expense.findByIdAndUpdate(
    id,
    {
      status: "PAID",
      paidAt: new Date(),
      transferProofFile: file ? file.filename : null,
    },
    { returnDocument: "after" }
  );

  await ExpenseLog.create({
    expenseId: id,
    userId,
    role: "FINANCE",
    action: "APPROVED",
    note: note || "Klaim dicairkan oleh Finance",
  });

  try {
    const formattedAmount = expense.amount.toLocaleString("id-ID");
    await notificationService.createNotification({
      userId: expense.userId,
      senderId: userId,
      senderName: "Finance",
      title: "Dana Klaim Berhasil Dicairkan 🎉",
      text: `Hore! Dana untuk klaim "${expense.title}" senilai Rp ${formattedAmount} telah dikirim oleh tim keuangan.`,
      module: "EXPENSE",
      referenceId: expense._id,
      actionUrl: `/expense/detail/${expense._id}`,
      type: "EXPENSE",
      category: NOTIF_CATEGORIES.INFO,
    });
  } catch (notifError) {
    console.error(notifError.message);
  }

  return expense;
};

export const findClaimById = async (id, currentUser) => {
  const expense = await Expense.findById(id)
    .populate({
      path: "employeeId",
      populate: {
        path: "careerData",
        populate: { path: "bidangId" },
      },
    })
    .populate("category")
    .lean();

  if (!expense) {
    throw new Error("Data pengajuan klaim beban tidak ditemukan atau telah dihapus.");
  }

  const rawLogs = await ExpenseLog.find({ expenseId: id })
    .populate("userId", "name")
    .sort({ createdAt: 1 })
    .lean();

  const logs = rawLogs.map((l) => ({
    role: l.role,
    status: l.action,
    user: l.userId,
    note: l.note,
    createdAt: l.createdAt,
  }));

  const userRole = currentUser.role?.toUpperCase();
  let canApprove = false;

  if (
    expense.status === "PENDING_MANAGER" &&
    String(expense.approverRoleId) === String(currentUser.roleId)
  ) {
    canApprove = true;
  } else if (expense.status === "PENDING_FINANCE" && userRole === "MANAGER_KEUANGAN") {
    canApprove = true;
  }

  return {
    ...expense,
    user: expense.userId,
    receipt: expense.proofFile
      ? `/uploads/${expense.proofFile}`
      : expense.transferProofFile
        ? `/uploads/${expense.transferProofFile}`
        : null,
    canApprove,
    logs,
  };
};
