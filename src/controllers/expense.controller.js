import ExpenseClaim from "../models/ExpenseClaim.model.js";
import Employee from "../models/employee/Employee.model.js";
import ExpenseCategory from "../models/ExpenseCategory.model.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
export const formExpense = async (req, res) => {
  try {
    const categories = await ExpenseCategory.find({ isActive: true }).sort({ name: 1 });

    res.render("expense/create", {
      title: "Ajukan Klaim Beban",
      categories,
      errors: {},
      old: {},
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error loading expense form");
  }
};

export const createExpense = async (req, res) => {
  try {
    const categories = await ExpenseCategory.find({ isActive: true }).sort({ name: 1 });

    if (req.validationErrors) {
      return res.status(400).render("expense/create", {
        title: "Ajukan Klaim Beban",
        categories,
        errors: req.validationErrors,
        old: req.body,
      });
    }

    const { title, category, amount, expenseDate, noReceiptReason, selfDeclaration, noReceipt } =
      req.body;

    const user = req.session.user;
    if (!user) return res.status(401).send("Unauthorized");

    const employee = await Employee.findOne({ userId: user._id });
    if (!employee) return res.status(404).send("Employee data tidak ditemukan");

    const isNoReceipt = !!noReceipt;
    const hasFile = !!req.file;

    if (!isNoReceipt && !hasFile) {
      return res.status(400).render("expense/create", {
        title: "Ajukan Klaim Beban",
        categories,
        errors: { proofFile: "Upload bukti transaksi wajib jika nota tersedia." },
        old: req.body,
      });
    }

    const cleanAmount = Number(amount) || 0;
    let status = "PENDING_FINANCE";
    if (cleanAmount > 200000) {
      status = "PENDING_MANAGER";
    }

    await ExpenseClaim.create({
      userId: user._id,
      employeeId: employee._id,
      title,
      category,
      amount: cleanAmount,
      expenseDate,
      noReceiptReason: isNoReceipt ? noReceiptReason : null,
      selfDeclaration: isNoReceipt ? !!selfDeclaration : false,
      status,
      proofFile: hasFile ? req.file.filename : null,
    });

    return res.redirect("/expense/my");
  } catch (err) {
    console.error("CREATE EXPENSE ERROR:", err);
    return res.status(500).send("Create expense error: " + err.message);
  }
};
export const myExpenses = async (req, res) => {
  try {
    const { page } = req.query;
    const { page: currentPage, limit, skip } = getPagination({ page, limit: 10 });

    // Hitung total data klaim khusus milik user ini
    const totalExpenses = await ExpenseClaim.countDocuments({ userId: req.user._id });
    const pagination = getPaginationMeta({ page: currentPage, limit, total: totalExpenses });

    // Ambil data dengan Mongoose Pagination
    const expenses = await ExpenseClaim.find({ userId: req.user._id })
      .populate("category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("expense/my", {
      title: "Klaim Pengeluaran Saya",
      expenses,
      pagination, // <--- Wajib dikirim ke EJS
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading my expenses");
  }
};

export const approvalManagerExpense = async (req, res) => {
  try {
    const { page } = req.query;
    const { page: currentPage, limit, skip } = getPagination({ page, limit: 10 });

    // Hitung total seluruh klaim untuk dimanajemeni
    const totalExpenses = await ExpenseClaim.countDocuments({});
    const pagination = getPaginationMeta({ page: currentPage, limit, total: totalExpenses });

    const expenses = await ExpenseClaim.find({})
      .populate("employeeId")
      .populate("category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("expense/approval", {
      title: "Approval Klaim Operasional",
      expenses,
      pagination, // <--- Wajib dikirim ke EJS
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading approval page");
  }
};
export const approveManagerExpense = async (req, res) => {
  try {
    await ExpenseClaim.findByIdAndUpdate(req.params.id, {
      status: "PENDING_FINANCE",
      managerApprovedBy: req.session.user._id,
    });

    res.redirect("/expense/approval/manager");
  } catch (err) {
    console.log(err);
    res.status(500).send("Approve manager error");
  }
};

export const financeExpensePage = async (req, res) => {
  try {
    const { page } = req.query;
    const { page: currentPage, limit, skip } = getPagination({ page, limit: 10 });

    // Filter finance biasanya hanya melihat yang siap bayar atau rekam jejak lunas
    const financeQuery = { status: { $in: ["PENDING_FINANCE", "PAID"] } };

    const totalExpenses = await ExpenseClaim.countDocuments(financeQuery);
    const pagination = getPaginationMeta({ page: currentPage, limit, total: totalExpenses });

    const expenses = await ExpenseClaim.find(financeQuery)
      .populate("employeeId")
      .populate("category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("expense/finance", {
      title: "Manajemen Keuangan Klaim",
      expenses,
      pagination, // <--- Wajib dikirim ke EJS
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading finance page");
  }
};
export const payExpense = async (req, res) => {
  try {
    const { id } = req.params;

    await ExpenseClaim.findByIdAndUpdate(id, {
      status: "PAID",
      financeApprovedBy: req.session.user._id,
      paidAt: new Date(),
      transferProofFile: req.file ? req.file.filename : null,
    });

    res.redirect("/expense/finance");
  } catch (err) {
    console.log("Payment error:", err);
    res.status(500).send("Payment error");
  }
};
export const rejectManagerExpense = async (req, res) => {
  try {
    await ExpenseClaim.findByIdAndUpdate(req.params.id, {
      status: "REJECTED",
      managerApprovedBy: req.session.user._id,
    });

    res.redirect("/expense/approval/manager");
  } catch (err) {
    console.log("Reject manager error:", err);
    res.status(500).send("Reject manager error");
  }
};
