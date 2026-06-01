import Loan from "../models/loan/Loan.model.js";
import LoanApproval from "../models/loan/LoanApproval.model.js";
import loanService from "../services/loan.service.js";
import AppError from "../utils/AppError.js";

export const newForm = async (req, res, next) => {
  try {
    const employeeData = await loanService.getEmployeeForForm(req.user._id);
    res.render("loans/new", {
      title: "Form Pengajuan Pinjaman",
      employee: employeeData,
      salary: employeeData.basicSalary,
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
    const userRole = (req.session.user?.role || "").toString().trim().toUpperCase();

    await loanService.createLoan(employeeId, req.body, userRole);

    res.redirect("/loans/my");
  } catch (error) {
    try {
      const userId = req.session.user?._id;

      const employeeData = await loanService.getEmployeeForForm(userId);

      return res.render("loans/new", {
        title: "Pengajuan Pinjaman",
        employee: employeeData,
        salary: employeeData.basicSalary || 0,
        formData: req.body,
        errorMessage: error.message,
      });
    } catch (innerError) {
      next(new AppError(error.message, 400));
    }
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
    const { loan, basicSalary } = await loanService.getLoanForEdit(req.params.id, req.user._id);

    res.render("loans/new", {
      title: "Edit Pengajuan Pinjaman",
      loan: loan,
      formData: loan,
      salary: basicSalary,
      errorMessage: null,
    });
  } catch (error) {
    next(new AppError(error.message || "Data tidak ditemukan", 404));
  }
};

export const update = async (req, res, next) => {
  try {
    await loanService.updateLoan(req.params.id, req.user._id, req.body);
    res.redirect("/loans/my");
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

export const cancel = async (req, res, next) => {
  try {
    await loanService.cancelLoan(req.params.id, req.user._id);
    res.redirect("/loans/my");
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

export const getManageLoanPage = async (req, res, next) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser) throw new AppError("Sesi Anda telah berakhir.", 401);
    const data = await loanService.getLoanManagementData(sessionUser);
    res.render("loans/approval", {
      title: "Pusat Kelola Pinjaman",
      user: sessionUser,
      activeLoans: data.activeLoans,
      historyLoans: data.historyLoans,
    });
  } catch (error) {
    next(error);
  }
};

export const approveLoan = async (req, res, next) => {
  try {
    const { note } = req.body;
    const sessionUser = req.session.user;
    if (!sessionUser) throw new AppError("Sesi Anda telah berakhir.", 401);
    const { id } = req.params;
    await loanService.processApproval(id, sessionUser, note, req.file);
    return res.redirect("/loans/approval");
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

export const rejectLoan = async (req, res, next) => {
  try {
    const { note } = req.body;
    const sessionUser = req.session.user;
    if (!sessionUser) throw new AppError("Sesi Anda telah berakhir.", 401);
    const { id } = req.params;
    await loanService.processReject(id, sessionUser, note);
    return res.redirect("/loans/approval");
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

export const getFinanceCenterPage = async (req, res, next) => {
  try {
    const sessionUser = req.session.user;
    const data = await loanService.getLoanManagementData(sessionUser);
    res.render("loans/approval", {
      title: "Pusat Pencairan Dana",
      activeLoans: data.activeLoans,
      historyLoans: data.historyLoans,
    });
  } catch (error) {
    next(error);
  }
};

export const disburseLoan = async (req, res, next) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser) throw new AppError("Sesi Anda telah berakhir.", 401);
    const { note } = req.body;
    const { id } = req.params;
    await loanService.processDisbursement(id, sessionUser, note, req.file);
    return res.redirect("/loans/disbursement");
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};
