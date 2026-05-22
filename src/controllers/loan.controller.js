import loanService from "../services/loan.service.js";

export const newForm = async (req, res, next) => {
  try {
    const employee = await loanService.getEmployeeForForm(req.user._id);

    res.render("loans/new", {
      title: "Form Pengajuan Pinjaman",
      employee,
      error: null,
      old: null,
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    await loanService.createLoan(req.user._id, req.body);

    res.redirect("/loans/my");
  } catch (error) {
    res.status(400).render("loans/new", {
      title: "Form Pengajuan Pinjaman",
      errorMessage: error.message,
      oldData: req.body,
    });
  }
};

export const myLoans = async (req, res, next) => {
  try {
    const loans = await loanService.getEmployeeLoanHistory(req.user._id);
    res.render("loans/my", {
      title: "Riwayat Pinjaman Saya",
      loans,
    });
  } catch (error) {
    next(error);
  }
};

export const edit = async (req, res, next) => {
  try {
    const loan = await loanService.getLoanForEdit(req.params.id, req.user._id);
    res.render("loans/edit", {
      title: "Edit Pengajuan Pinjaman",
      loan,
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
    res.status(400).render("loans/edit", {
      title: "Edit Pengajuan Pinjaman",
      errorMessage: error.message,
      loan: { _id: req.params.id, ...req.body },
    });
  }
};
