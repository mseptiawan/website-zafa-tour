import ExpenseClaim from "../models/ExpenseClaim.js";
import Employee from "../models/Employee.js";

/*
|--------------------------------------------------------------------------
| FORM CREATE
|--------------------------------------------------------------------------
*/
export const formExpense = (req, res) => {
  res.render("expense/create", {
    title: "Ajukan Klaim Beban",
  });
};

/*
|--------------------------------------------------------------------------
| CREATE CLAIM
|--------------------------------------------------------------------------
*/
export const createExpense = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      amount,
      expenseDate,
      noReceiptReason,
      selfDeclaration,
      noReceipt,
    } = req.body;

    const user = req.session.user;

    if (!user) {
      return res.status(401).send("Unauthorized");
    }
    const employee = await Employee.findOne({ userId: user._id });

    if (!employee) {
      return res.status(404).send("Employee data tidak ditemukan");
    }
    const isNoReceipt = noReceipt === "on";
    const hasFile = !!req.file;

    // =========================
    // VALIDASI BUSINESS RULE
    // =========================
    if (!isNoReceipt && !hasFile) {
      return res
        .status(400)
        .send("Upload bukti transaksi wajib jika tidak memilih 'tidak ada bukti'");
    }

    if (isNoReceipt && !selfDeclaration) {
      return res.status(400).send("Self declaration wajib dicentang jika tidak ada bukti");
    }

    if (isNoReceipt && !noReceiptReason) {
      return res.status(400).send("Alasan tidak ada bukti wajib diisi");
    }

    // optional (kalau masih dipakai di sistem lain)
    await Employee.findOne({ userId: user._id });

    // =========================
    // AUTO FLOW STATUS
    // =========================
    let status = "PENDING_FINANCE";
    if (Number(amount) > 200000) {
      status = "PENDING_MANAGER";
    }

    // =========================
    // CREATE DATA
    // =========================
    await ExpenseClaim.create({
      userId: user._id,
      employeeId: employee._id,
      title,
      category,
      amount,
      expenseDate,

      // hanya dipakai jika no receipt
      noReceiptReason: isNoReceipt ? noReceiptReason : null,

      selfDeclaration: isNoReceipt ? true : false,

      status,

      proofFile: hasFile ? req.file.filename : null,
    });

    return res.redirect("/expense/my");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Create expense error");
  }
};

/*
|--------------------------------------------------------------------------
| MY CLAIM
|--------------------------------------------------------------------------
*/
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

/*
|--------------------------------------------------------------------------
| ALL CLAIM
|--------------------------------------------------------------------------
*/
export const allExpenses = async (req, res) => {
  try {
    const expenses = await ExpenseClaim.find().populate("userId").sort({ createdAt: -1 });

    res.render("expense/all", {
      title: "Semua Klaim",
      expenses,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
};

/*
|--------------------------------------------------------------------------
| APPROVAL MANAGER
|--------------------------------------------------------------------------
*/
export const approvalManagerExpense = async (req, res) => {
  try {
    const expenses = await ExpenseClaim.find({
      status: "PENDING_MANAGER",
    })
      .populate("userId")
      .populate("employeeId");

    res.render("expense/approval-manager", {
      title: "Approval Klaim",
      expenses,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
};

/*
|--------------------------------------------------------------------------
| APPROVE MANAGER
|--------------------------------------------------------------------------
*/
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

/*
|--------------------------------------------------------------------------
| FINANCE VALIDATION
|--------------------------------------------------------------------------
*/
export const financeExpensePage = async (req, res) => {
  try {
    const expenses = await ExpenseClaim.find({
      status: "PENDING_FINANCE",
    })
      .populate("userId")
      .populate("employeeId");

    res.render("expense/finance", {
      title: "Validasi Finance",
      expenses,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
};
/*
|--------------------------------------------------------------------------
| MARK AS PAID
|--------------------------------------------------------------------------
*/
export const payExpense = async (req, res) => {
  try {
    await ExpenseClaim.findByIdAndUpdate(req.params.id, {
      status: "PAID",
      financeApprovedBy: req.session.user._id,
      paidAt: new Date(),
    });

    res.redirect("/expense/finance");
  } catch (err) {
    console.log(err);
    res.status(500).send("Payment error");
  }
};
