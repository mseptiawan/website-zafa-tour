import Loan from "../models/loan/Loan.model.js";
import LoanApproval from "../models/loan/LoanApproval.model.js";
import loanService from "../services/loan.service.js";

export const newForm = async (req, res, next) => {
  try {
    const employeeData = await loanService.getEmployeeForForm(req.user._id);
    res.render("loans/new", {
      title: "Form Pengajuan Pinjaman",
      employee: employeeData,
      error: null,
      old: null,
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const employeeId = req.session.user?.employeeId;

    await loanService.createLoan(employeeId, req.body);

    res.redirect("/loans/my");
  } catch (error) {
    res.status(400).render("loans/new", {
      title: "Form Pengajuan Pinjaman",
      error: error.message,
      old: req.body,
    });
  }
};
export const myLoans = async (req, res, next) => {
  try {
    const { loans, summary } = await loanService.getEmployeeLoanHistory(req.user._id);

    res.render("loans/my", {
      title: "Riwayat Pinjaman Saya",
      loans,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

export const getDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { loan, approvals, payments } = await loanService.getLoanDetailData(id);

    res.render("loans/detail", {
      title: "Detail Pengajuan Pinjaman",
      loan,
      approvals,
      payments,
      user: req.session.user,
    });
  } catch (error) {
    next(error);
  }
};

export const edit = async (req, res, next) => {
  try {
    const loan = await loanService.getLoanForEdit(req.params.id, req.user._id);
    res.render("loans/new", {
      title: "Edit Pengajuan Pinjaman",
      loan,
      errorMessage: null,
    });
  } catch (error) {
    res.status(400).redirect("/loans/my");
  }
};

export const update = async (req, res, next) => {
  try {
    await loanService.updateLoan(req.params.id, req.user._id, req.body);
    res.redirect("/loans/my");
  } catch (error) {
    res.status(400).render("loans/new", {
      title: "Edit Pengajuan Pinjaman",
      errorMessage: error.message,
      loan: {
        _id: req.params.id,
        amountRequested: req.body.amountRequested,
        tenorMonths: req.body.tenorMonths,
        reason: req.body.reason,
      },
    });
  }
};

export const cancel = async (req, res, next) => {
  try {
    await loanService.cancelLoan(req.params.id, req.user._id);
    res.redirect("/loans/my");
  } catch (error) {
    res.status(400).redirect("/loans/my?error=" + encodeURIComponent(error.message));
  }
};
export const getManageLoanPage = async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser) return res.redirect("/?error=UNAUTHORIZED");

    const normalizedRole = (sessionUser.roleId?.name || "").toString().trim().toUpperCase();
    const VALID_LOAN_ROLES = ["HR", "PIMPINAN", "KEUANGAN"];

    if (!VALID_LOAN_ROLES.includes(normalizedRole)) {
      return res.redirect("/?error=FORBIDDEN");
    }

    const myApprovals = await LoanApproval.find({
      $or: [{ approverId: sessionUser._id }, { step: normalizedRole }],
    });

    const activeLoanIds = [];
    const historyLoanIds = [];

    for (const app of myApprovals) {
      if (app.status === "PENDING") {
        if (app.step === "PIMPINAN") {
          const hrCheck = await LoanApproval.findOne({ loanId: app.loanId, step: "HR" });
          if (hrCheck && hrCheck.status !== "APPROVED") continue;
        }

        if (app.step === "KEUANGAN") {
          const pimpinanCheck = await LoanApproval.findOne({
            loanId: app.loanId,
            step: "PIMPINAN",
          });
          if (pimpinanCheck && pimpinanCheck.status !== "APPROVED") continue;
        }

        activeLoanIds.push(app.loanId);
      } else {
        historyLoanIds.push(app.loanId);
      }
    }

    const activeLoans = await Loan.find({ _id: { $in: activeLoanIds }, status: "PENDING" })
      .populate({ path: "employeeId", select: "fullName" })
      .sort({ createdAt: -1 });

    const historyLoans = await Loan.find({ _id: { $in: historyLoanIds } })
      .populate({ path: "employeeId", select: "fullName" })
      .sort({ createdAt: -1 });

    return res.render("loans/manage-center", {
      title: "Pusat Kelola Pinjaman Karyawan",
      user: sessionUser,
      activeLoans,
      historyLoans,
    });
  } catch (error) {
    return res.status(500).render("error", {
      title: "Pusat Pinjaman - Error",
      message: error.message,
    });
  }
};

export const approveLoan = async (req, res) => {
  try {
    const { note } = req.body;
    const sessionUser = req.session.user;
    if (!sessionUser)
      return res.status(401).render("error", { title: "Error", message: "Sesi habis." });

    const approval = await LoanApproval.findOne({ _id: req.params.id, status: "PENDING" });
    if (!approval)
      return res
        .status(404)
        .render("error", { title: "Error", message: "Antrean tidak ditemukan." });

    approval.status = "APPROVED";
    approval.note = note || "";
    approval.actionDate = new Date();
    await approval.save();

    const loan = await Loan.findById(approval.loanId);

    const { nextStep, nextApproverId } = await loanService.getNextLoanApprover(approval.step);

    if (nextApproverId) {
      await LoanApproval.create({
        loanId: loan._id,
        step: nextStep,
        approverId: nextApproverId,
        status: "PENDING",
      });
    } else {
      if (approval.step === "KEUANGAN") {
        loan.status = "APPROVED";
        loan.disbursementDate = new Date();
        if (req.file) {
          loan.paymentProof = `/uploads/loans/${req.file.filename}`;
        }
        await loan.save();
      }
    }

    return res.redirect("/loans/manage-center");
  } catch (error) {
    return res.status(500).render("error", { title: "Approve Loan Error", message: error.message });
  }
};

export const rejectLoan = async (req, res) => {
  try {
    const { note } = req.body;
    const sessionUser = req.session.user;
    if (!sessionUser)
      return res.status(401).render("error", { title: "Error", message: "Sesi habis." });

    const approval = await LoanApproval.findOne({ _id: req.params.id, status: "PENDING" });
    if (!approval)
      return res.status(404).render("error", { title: "Error", message: "Data tidak ditemukan." });

    approval.status = "REJECTED";
    approval.note = note || "";
    approval.actionDate = new Date();
    await approval.save();

    await Loan.findByIdAndUpdate(approval.loanId, { status: "REJECTED" });

    return res.redirect("/loans/manage-center");
  } catch (error) {
    return res.status(500).render("error", { title: "Reject Loan Error", message: error.message });
  }
};
