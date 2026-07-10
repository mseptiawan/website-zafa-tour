import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import {
  findActiveCategoriesService,
  createExpenseService,
  findMyExpenseService,
  findManagerApprovalsService,
  rejectByManagerService,
  processApprovalService,
  findFinanceExpenseService,
  processPaymentService,
  findExpenseByIdService,
} from "../services/expense.service.js";

// ─── METHOD 1: FORM CREATE VIEW ───────────────────
export const renderCreateExpenseForm = asyncHandler(async (req, res) => {
  const categories = await findActiveCategoriesService();

  res.render("expense/create", {
    ...buildRenderData(req, {
      title: "Ajukan Reimbursement",
      categories,
      errors: {},
      old: {},
    }),
  });
});

// ─── METHOD 2: STORE DATA CLAIM ───────────────────
export const storeExpense = asyncHandler(async (req, res) => {
  const categories = await findActiveCategoriesService();

  if (req.validationErrors) {
    return res.status(400).render("expense/create", {
      ...buildRenderData(req, {
        title: "Ajukan Reimbursement",
        categories,
        errors: req.validationErrors,
        old: req.body,
      }),
    });
  }

  try {
    await createExpenseService({
      body: req.body,
      file: req.file,
      currentUser: req.session.user,
    });

    req.flash("success", "Reimbursement berhasil diajukan!");

    await new Promise((resolve) => req.session.save(resolve));
    return res.redirect("/expense/me");
  } catch (error) {
    if (error.statusCode === 400 && error.field) {
      return res.status(400).render("expense/create", {
        ...buildRenderData(req, {
          title: "Ajukan Reimbursement",
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
export const getMyExpenses = asyncHandler(async (req, res) => {
  const { page } = req.query;
  const userId = req.session.user._id;

  const { data: expenses, meta: pagination } = await findMyExpenseService({ userId, page });

  res.render("expense/history", {
    ...buildRenderData(req, {
      title: "Riwayat Reimbursement",
      expenses,
      pagination,
    }),
  });
});

// ─── METHOD 4: MANAGER ANTREAN VIEW ───────────────
export const getExpenseApprovalPage = asyncHandler(async (req, res) => {
  const { page } = req.query;
  const { roleId, _id: userId } = req.session.user;

  const { data: expenses, meta: pagination } = await findManagerApprovalsService({
    roleId,
    userId,
    page,
  });

  res.render("expense/approvals", {
    ...buildRenderData(req, {
      title: "Persetujuan Reimbursement",
      expenses,
      pagination,
    }),
  });
});

// ─── METHOD 5: ACTION APPROVE (KONDISIONAL MANAGER / FINANCE) ───
export const approveExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const currentUser = req.session.user;

  try {
    const expense = await findExpenseByIdService(id, currentUser);

    const userRole = currentUser.role?.toUpperCase();

    if (expense.status === "PENDING_FINANCE") {
      if (userRole !== "MANAGER_KEUANGAN") {
        req.flash("error", "Anda tidak memiliki akses finansial untuk mencairkan dana.");
        return res.redirect(`/expense/detail/${id}`);
      }
    }

    const { nextStatus } = await processApprovalService({
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
        ? "Reimbursement berhasil dicairkan dan ditandai Lunas!"
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
export const rejectExpense = asyncHandler(async (req, res) => {
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
    await rejectByManagerService({ id, userId: currentUser._id, role: "MANAGER", note });
  }

  req.flash("error", "Permohonan reimbursement telah ditolak.");
  await new Promise((resolve) => req.session.save(resolve));

  res.redirect(roleType === "FINANCE" ? "/expense/finance" : "/expense/approval/manager");
});

// ─── METHOD 7: FINANCE ANTREAN VIEW ───────────────
export const getExpenseFinancePage = asyncHandler(async (req, res) => {
  const { page } = req.query;

  const { data: expenses, meta: pagination } = await findFinanceExpenseService({ page });

  res.render("expense/finance", {
    ...buildRenderData(req, {
      title: "Persetujuan Reimbursement",
      expenses,
      pagination,
    }),
  });
});

// ─── METHOD 8: FINANCE ACTION DISBURSE (KLIK TOMBOL BAYAR LANGSUNG) ───
export const payExpense = asyncHandler(async (req, res) => {
  await processPaymentService({
    id: req.params.id,
    userId: req.session.user._id,
    file: req.file,
    note: "Dana dicairkan oleh Finance",
  });

  req.flash("success", "Reimbursement berhasil dicairkan dan ditandai Lunas.");
  await new Promise((resolve) => req.session.save(resolve));

  res.redirect("/expense/finance");
});

// ─── METHOD 9: SHOW DETAIL CLAIM ──────────────────
export const showExpense = asyncHandler(async (req, res) => {
  const expenseId = req.params.id;
  const currentUser = req.session.user;

  const expense = await findExpenseByIdService(expenseId, currentUser);

  res.render("expense/detail", {
    ...buildRenderData(req, {
      title: `Detail Reimbursement - ${expense.title}`,
      expense,
    }),
  });
});
