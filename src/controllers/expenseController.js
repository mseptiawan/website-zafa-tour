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
    } = req.body;

    const employee = await Employee.findById(req.session.user.employeeId);
    console.log(req.session.user);
    if (!employee) {
      return res.send("Employee not found");
    }

    // =========================
    // VALIDASI
    // =========================
    if (!req.file && !selfDeclaration) {
      return res.send("Upload bukti atau centang pernyataan");
    }

    // =========================
    // AUTO FLOW
    // =========================
    let status = "PENDING_FINANCE";

    if (Number(amount) > 200000) {
      status = "PENDING_MANAGER";
    }

    await ExpenseClaim.create({
      employeeId: employee._id,

      title,
      description,
      category,

      amount,

      expenseDate,

      noReceiptReason,

      selfDeclaration: selfDeclaration === "on",

      status,

      proofFile: req.file ? req.file.filename : null,
    });

    res.redirect("/expense/my");
  } catch (err) {
    console.log(err);

    res.status(500).send("Create expense error");
  }
};

/*
|--------------------------------------------------------------------------
| MY CLAIM
|--------------------------------------------------------------------------
*/
export const myExpenses = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.session.user._id,
    });

    const expenses = await ExpenseClaim.find({
      employeeId: employee._id,
    }).sort({
      createdAt: -1,
    });

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
    const expenses = await ExpenseClaim.find().populate("employeeId").sort({
      createdAt: -1,
    });

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
    }).populate("employeeId");

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
    }).populate("employeeId");

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
