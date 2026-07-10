import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import {
  getEmployeeForFormService,
  storeLoanService,
  getEmployeeLoanHistoryService,
  getLoanDetailDataService,
  getLoanForEditService,
  updateLoanService,
  getLoanManagementDataService,
  processApprovalService,
  processRejectService,
  processDisbursementService,
  cancelLoanService,
} from "../services/loan.service.js";

export const renderCreateForm = asyncHandler(async (req, res) => {
  const employeeData = await getEmployeeForFormService(req.session.user._id);
  res.render("loans/create", {
    ...buildRenderData(req, {
      title: "Form Pengajuan Pinjaman",
      employee: employeeData,
      salary: employeeData.financialData?.basicSalary || 0,
      errorMessage: null,
    }),
  });
});
export const storeLoan = asyncHandler(async (req, res) => {
  const employeeId = req.session.user?.employeeId;
  const userRole = (req.session.user?.role || "").toString().trim().toUpperCase();
  const creatorName = req.session.user?.fullName || "Karyawan";

  try {
    await storeLoanService(employeeId, req.body, userRole, creatorName);

    req.flash("success", "Pengajuan pinjaman Anda berhasil didaftarkan ke sistem.");
    return res.redirect("/loans/me");
  } catch (error) {
    const employeeData = await getEmployeeForFormService(req.session.user._id);
    return res.render("loans/create", {
      ...buildRenderData(req, {
        title: "Pengajuan Pinjaman",
        employee: employeeData,
        salary: employeeData.financialData?.basicSalary || 0,
        formData: req.body,
        errorMessage: error.message,
      }),
    });
  }
});
export const getMyLoans = asyncHandler(async (req, res) => {
  const { loans, summary } = await getEmployeeLoanHistoryService(req.session.user._id);
  res.render("loans/history", {
    ...buildRenderData(req, {
      title: "Riwayat Pinjaman",
      loans,
      summary,
    }),
  });
});

export const getDetailLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { loan, approvals, payments } = await getLoanDetailDataService(id);

  const referrer = req.get("Referer") || "";
  let backLink = "/loans/me";

  if (referrer.includes("/loans/approval")) {
    backLink = "/loans/approval";
  } else if (referrer.includes("/loans/disbursement")) {
    backLink = "/loans/disbursement";
  }

  res.render("loans/detail", {
    ...buildRenderData(req, {
      title: "Detail Pengajuan Pinjaman",
      loan,
      approvals,
      payments,
      user: req.session.user,
      backLink,
    }),
  });
});
export const editLoan = asyncHandler(async (req, res) => {
  const { loan, basicSalary } = await getLoanForEditService(req.params.id, req.session.user._id);
  res.render("loans/create", {
    ...buildRenderData(req, {
      title: "Edit Pengajuan Pinjaman",
      loan,
      formData: loan,
      salary: basicSalary,
      errorMessage: null,
    }),
  });
});

export const updateLoan = asyncHandler(async (req, res) => {
  try {
    await updateLoanService(req.params.id, req.session.user._id, req.body);
    req.flash("success", "Pengajuan pinjaman berhasil diperbarui.");
    return res.redirect("/loans/me");
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("back");
  }
});

export const cancelLoan = asyncHandler(async (req, res) => {
  try {
    await cancelLoanService(req.params.id, req.session.user._id);
    req.flash("success", "Pengajuan pinjaman berhasil dibatalkan.");
  } catch (error) {
    req.flash("error", error.message);
  }
  return res.redirect("/loans/me");
});

export const getManageLoanPage = asyncHandler(async (req, res) => {
  const data = await getLoanManagementDataService(req.session.user);
  res.render("loans/approvals", {
    ...buildRenderData(req, {
      title: "Pusat Kelola Pinjaman",
      user: req.session.user,
      activeLoans: data.activeLoans,
      historyLoans: data.historyLoans,
    }),
  });
});

export const approveLoan = asyncHandler(async (req, res) => {
  try {
    await processApprovalService(req.params.id, req.session.user, req.body.note);
    req.flash("success", "Dokumen pinjaman berhasil disetujui.");
  } catch (error) {
    req.flash("error", error.message);
  }
  return res.redirect("/loans/approval");
});

export const rejectLoan = asyncHandler(async (req, res) => {
  try {
    await processRejectService(req.params.id, req.session.user, req.body.note);
    req.flash("error", "Pengajuan pinjaman ditolak.");
  } catch (error) {
    req.flash("error", error.message);
  }
  return res.redirect("/loans/approval");
});

export const getFinanceCenterPageLoan = asyncHandler(async (req, res) => {
  const data = await getLoanManagementDataService(req.session.user);
  res.render("loans/approvals", {
    ...buildRenderData(req, {
      title: "Pusat Pencairan Dana",
      activeLoans: data.activeLoans,
      historyLoans: data.historyLoans,
    }),
  });
});

export const disburseLoan = asyncHandler(async (req, res) => {
  try {
    await processDisbursementService(req.params.id, req.session.user, req.body.note, req.file);
    req.flash("success", "Dana tunai pinjaman berhasil dicairkan ke rekening karyawan.");
  } catch (error) {
    req.flash("error", error.message);
  }
  return res.redirect("/loans/disbursement");
});
