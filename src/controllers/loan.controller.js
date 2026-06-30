import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import * as loanService from "../services/loan.service.js";

export const newForm = asyncHandler(async (req, res) => {
  const employeeData = await loanService.getEmployeeForForm(req.session.user._id);
  res.render("loans/new", {
    ...buildRenderData(req, {
      title: "Form Pengajuan Pinjaman",
      employee: employeeData,
      salary: employeeData.financialData?.basicSalary || 0,
      errorMessage: null,
    }),
  });
});
export const create = asyncHandler(async (req, res) => {
  const employeeId = req.session.user?.employeeId;
  const userRole = (req.session.user?.role || "").toString().trim().toUpperCase();
  const creatorName = req.session.user?.fullName || "Karyawan";

  try {
    await loanService.createLoan(employeeId, req.body, userRole, creatorName);

    req.flash("success", "Pengajuan pinjaman Anda berhasil didaftarkan ke sistem.");
    return res.redirect("/loans/my");
  } catch (error) {
    const employeeData = await loanService.getEmployeeForForm(req.session.user._id);
    return res.render("loans/new", {
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
export const myLoans = asyncHandler(async (req, res) => {
  const { loans, summary } = await loanService.getEmployeeLoanHistory(req.session.user._id);
  res.render("loans/my", {
    ...buildRenderData(req, {
      title: "Riwayat Pinjaman",
      loans,
      summary,
    }),
  });
});

export const getDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { loan, approvals, payments } = await loanService.getLoanDetailData(id);
  res.render("loans/detail", {
    ...buildRenderData(req, {
      title: "Detail Pengajuan Pinjaman",
      loan,
      approvals,
      payments,
      user: req.session.user,
    }),
  });
});

export const edit = asyncHandler(async (req, res) => {
  const { loan, basicSalary } = await loanService.getLoanForEdit(
    req.params.id,
    req.session.user._id
  );
  res.render("loans/new", {
    ...buildRenderData(req, {
      title: "Edit Pengajuan Pinjaman",
      loan,
      formData: loan,
      salary: basicSalary,
      errorMessage: null,
    }),
  });
});

export const update = asyncHandler(async (req, res) => {
  try {
    await loanService.updateLoan(req.params.id, req.session.user._id, req.body);
    req.flash("success", "Pengajuan pinjaman berhasil diperbarui.");
    return res.redirect("/loans/my");
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("back");
  }
});

export const cancel = asyncHandler(async (req, res) => {
  try {
    await loanService.cancelLoan(req.params.id, req.session.user._id);
    req.flash("success", "Pengajuan pinjaman berhasil dibatalkan.");
  } catch (error) {
    req.flash("error", error.message);
  }
  return res.redirect("/loans/my");
});

export const getManageLoanPage = asyncHandler(async (req, res) => {
  const data = await loanService.getLoanManagementData(req.session.user);
  res.render("loans/approval", {
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
    await loanService.processApproval(req.params.id, req.session.user, req.body.note);
    req.flash("success", "Dokumen pinjaman berhasil disetujui.");
  } catch (error) {
    req.flash("error", error.message);
  }
  return res.redirect("/loans/approval");
});

export const rejectLoan = asyncHandler(async (req, res) => {
  try {
    await loanService.processReject(req.params.id, req.session.user, req.body.note);
    req.flash("error", "Pengajuan pinjaman ditolak.");
  } catch (error) {
    req.flash("error", error.message);
  }
  return res.redirect("/loans/approval");
});

export const getFinanceCenterPage = asyncHandler(async (req, res) => {
  const data = await loanService.getLoanManagementData(req.session.user);
  res.render("loans/approval", {
    ...buildRenderData(req, {
      title: "Pusat Pencairan Dana",
      activeLoans: data.activeLoans,
      historyLoans: data.historyLoans,
    }),
  });
});

export const disburseLoan = asyncHandler(async (req, res) => {
  try {
    await loanService.processDisbursement(req.params.id, req.session.user, req.body.note, req.file);
    req.flash("success", "Dana tunai pinjaman berhasil dicairkan ke rekening karyawan.");
  } catch (error) {
    req.flash("error", error.message);
  }
  return res.redirect("/loans/disbursement");
});
