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

export const getManageLoanPage = async (req, res, next) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser) return res.redirect("/?error=UNAUTHORIZED");

    const data = await loanService.getLoanManagementData(sessionUser);

    res.render("loans/loan-management", {
      title: "Pusat Kelola Pinjaman",
      user: sessionUser,
      activeLoans: data.activeLoans,
      historyLoans: data.historyLoans,
    });
  } catch (error) {
    next(error);
  }
};

export const approveLoan = async (req, res) => {
  try {
    const { note } = req.body;
    const sessionUser = req.session.user;
    
    // Proteksi awal jika session rusak / hilang
    if (!sessionUser) {
      return res.status(401).render("error", { 
        title: "Error", 
        message: "Sesi Anda telah berakhir. Silakan login kembali." 
      });
    }

    const { id } = req.params; // Ini adalah ID dari LoanApproval

    // Eksekusi approval melalui Service
    await loanService.processApproval(id, sessionUser, note, req.file);

    // Jika sukses, kembalikan ke halaman manajemen center
    return res.redirect("/loans/manage-center");
  } catch (error) {
    // Tangani error validasi step atau error database
    return res.status(400).render("error", { 
      title: "Approve Loan Error", 
      message: error.message 
    });
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

    return res.redirect("/loans/loan-management");
  } catch (error) {
    return res.status(500).render("error", { title: "Reject Loan Error", message: error.message });
  }
}
export const getFinanceCenterPage = async (req, res, next) => {
  try {
    const sessionUser = req.session.user;
    const data = await loanService.getLoanManagementData(sessionUser);

    res.render("loans/finance-center", { 
      title: "Pusat Pencairan Dana",
      activeLoans: data.activeLoans, 
      historyLoans: data.historyLoans
    });
  } catch (error) {
    next(error);
  }
};
//   export const disburseLoan = async (req, res, next) => {
//   try {
//     const sessionUser = req.session.user;
//     if (!sessionUser) return res.status(401).redirect("/?error=UNAUTHORIZED");

//     const { note } = req.body;
//     const { id } = req.params; 

//     await loanService.processDisbursement(id, sessionUser, note, req.file);

//     return res.redirect("/loans/verifikasi-finance");
//   } catch (error) {
//     return res.status(400).render("error", { 
//       title: "Disbursement Error", 
//       message: error.message 
//     });
//   }
// };



