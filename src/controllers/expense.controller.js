import ExpenseClaim from "../models/ExpenseClaim.model.js";
import Employee from "../models/employee/Employee.model.js";
import ExpenseCategory from "../models/ExpenseCategory.model.js";
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
    const user = req.session.user;

    const expenses = await ExpenseClaim.find({
      userId: user._id,
    }).sort({ createdAt: -1 });

    res.render("expense/my", {
      title: "Klaim Saya",
      expenses,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
};

export const approvalManagerExpense = async (req, res) => {
  try {
    const expenses = await ExpenseClaim.find()
      .populate("userId")
      .populate("employeeId")
      .sort({ createdAt: -1 });

    res.render("expense/approval-manager", {
      title: "Approval Klaim Manager",
      expenses,
    });
  } catch (err) {
    console.log("Error approvalManagerExpense:", err);
    res.status(500).send("Internal Server Error");
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
    const expenses = await ExpenseClaim.find({
      status: {
        $in: ["PENDING_FINANCE", "PAID", "REJECTED"],
      },
    })
      .populate("userId")
      .populate("employeeId")
      .sort({ createdAt: -1 });

    res.render("expense/finance", {
      title: "Validasi Finance",
      expenses,
    });
  } catch (err) {
    console.error("Error pada financeExpensePage:", err);
    res.status(500).send("Internal Server Error");
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
