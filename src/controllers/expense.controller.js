import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import {
  findActiveCategories,
  createClaim,
  findMyClaims,
  findManagerApprovals,
  rejectByManager,
  processApproval,
  findFinanceClaims,
  processPayment,
  findClaimById,
} from "../services/expense.service.js";

// ─── METHOD 1: FORM CREATE VIEW ───────────────────
export const create = asyncHandler(async (req, res) => {
  const categories = await findActiveCategories();

  res.render("expense/create", {
    ...buildRenderData(req, {
      title: "Ajukan Klaim Beban",
      categories,
      errors: {},
      old: {},
    }),
  });
});

// ─── METHOD 2: STORE DATA CLAIM ───────────────────
export const store = asyncHandler(async (req, res) => {
  const categories = await findActiveCategories();

  if (req.validationErrors) {
    return res.status(400).render("expense/create", {
      ...buildRenderData(req, {
        title: "Ajukan Klaim Beban",
        categories,
        errors: req.validationErrors,
        old: req.body,
      }),
    });
  }

  try {
    await createClaim({
      body: req.body,
      file: req.file,
      currentUser: req.session.user,
    });

    req.flash("success", "Klaim operasional beban berhasil diajukan!");

    await new Promise((resolve) => req.session.save(resolve));
    return res.redirect("/expense/my");
  } catch (error) {
    if (error.statusCode === 400 && error.field) {
      return res.status(400).render("expense/create", {
        ...buildRenderData(req, {
          title: "Ajukan Klaim Beban",
          categories,
          errors: { [error.field]: error.message },
          old: req.body,
        }),
      });
    }
    throw error;
  }
});

// ─── METHOD 3: PERSONAL HISTORY VIEW ──────────────
export const my = asyncHandler(async (req, res) => {
  const { page } = req.query;
  const userId = req.session.user._id;

  const { data: expenses, meta: pagination } = await findMyClaims({ userId, page });

  res.render("expense/my", {
    ...buildRenderData(req, {
      title: "Riwayat Klaim Beban",
      expenses,
      pagination,
    }),
  });
});

// ─── METHOD 4: MANAGER ANTREAN VIEW ───────────────
export const approvalPage = asyncHandler(async (req, res) => {
  const { page } = req.query;
  const { roleId, _id: userId } = req.session.user;

  const { data: expenses, meta: pagination } = await findManagerApprovals({ roleId, userId, page });

  res.render("expense/approval", {
    ...buildRenderData(req, {
      title: "Approval Klaim Operasional",
      expenses,
      pagination,
    }),
  });
});

// ─── METHOD 5: ACTION APPROVE (KONDISIONAL MANAGER / FINANCE) ───
export const approveClaim = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const currentUser = req.session.user;

  try {
    const expense = await findClaimById(id, currentUser);

    const userRole = currentUser.role?.toUpperCase();

    if (expense.status === "PENDING_FINANCE") {
      if (userRole !== "MANAGER_KEUANGAN") {
        req.flash("error", "Anda tidak memiliki akses finansial untuk mencairkan dana.");
        return res.redirect(`/expense/detail/${id}`);
      }
    }

    const { nextStatus } = await processApproval({
      id,
      userId: currentUser._id,
      role: currentUser.role,
      file: req.file,
      note,
      currentStatus: expense.status,
    });

    req.flash(
      "success",
      nextStatus === "PAID"
        ? "Klaim berhasil dicairkan dan ditandai Lunas!"
        : "Berkas berhasil disetujui dan diteruskan ke Bagian Keuangan."
    );

    await new Promise((resolve) => req.session.save(resolve));
    return res.redirect(`/expense/detail/${id}`);
  } catch (error) {
    if (error.statusCode === 400 || error.message.includes("tidak ditemukan")) {
      req.flash("error", error.message);
      return res.redirect(req.header("Referer") || "/expense");
    }
    throw error;
  }
});
export const rejectClaim = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const currentUser = req.session.user;

  const roleType = currentUser.role?.toUpperCase() === "MANAGER_KEUANGAN" ? "FINANCE" : "MANAGER";

  if (roleType === "FINANCE") {
    await Expense.findByIdAndUpdate(id, { status: "REJECTED" });
    await ExpenseLog.create({
      expenseId: id,
      userId: currentUser._id,
      role: "FINANCE",
      action: "REJECTED",
      note,
    });
  } else {
    await rejectByManager({ id, userId: currentUser._id, role: "MANAGER", note });
  }

  req.flash("error", "Permohonan klaim beban telah ditolak.");
  await new Promise((resolve) => req.session.save(resolve));

  res.redirect(roleType === "FINANCE" ? "/expense/finance" : "/expense/approval/manager");
});

// ─── METHOD 7: FINANCE ANTREAN VIEW ───────────────
export const financePage = asyncHandler(async (req, res) => {
  const { page } = req.query;

  const { data: expenses, meta: pagination } = await findFinanceClaims({ page });

  res.render("expense/finance", {
    ...buildRenderData(req, {
      title: "Manajemen Keuangan Klaim",
      expenses,
      pagination,
    }),
  });
});

// ─── METHOD 8: FINANCE ACTION DISBURSE (KLIK TOMBOL BAYAR LANGSUNG) ───
export const payClaim = asyncHandler(async (req, res) => {
  await processPayment({
    id: req.params.id,
    userId: req.session.user._id,
    file: req.file,
    note: "Dana dicairkan oleh Finance",
  });

  req.flash("success", "Klaim beban berhasil dicairkan dan ditandai Lunas.");
  await new Promise((resolve) => req.session.save(resolve));

  res.redirect("/expense/finance");
});

// ─── METHOD 9: SHOW DETAIL CLAIM ──────────────────
export const show = asyncHandler(async (req, res) => {
  const expenseId = req.params.id;
  const currentUser = req.session.user;

  const expense = await findClaimById(expenseId, currentUser);

  res.render("expense/detail", {
    ...buildRenderData(req, {
      title: `Detail Klaim - ${expense.title}`,
      expense,
    }),
  });
});
