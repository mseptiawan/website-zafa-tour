import tripService from "../services/trip.service.js";

/* ---------------- FORM ---------------- */
export const newForm = (req, res) => {
  res.render("trip/user/index", {
    title: "Pengajuan Dinas Luar",
  });
};

/* ---------------- CREATE ---------------- */
export const create = async (req, res, next) => {
  try {
    await tripService.create({
      body: req.body,
      user: req.session.user,
    });

    return res.redirect("/trip/my");
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

/* ---------------- MY TRIPS ---------------- */
export const myTrips = async (req, res, next) => {
  try {
    const trips = await tripService.findMine(req.session.user._id);

    return res.render("trip/user/my", {
      title: "Perjalanan Saya",
      trips,
    });
  } catch (err) {
    next(err);
  }
};

/* ---------------- APPROVAL PAGE ---------------- */
export const approvalPage = async (req, res, next) => {
  try {
    const result = await tripService.approvalPage(req.session.user);

    return res.render("trip/approval", {
      title: "Approval Dinas Luar",
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/* ---------------- EDIT FORM ---------------- */
export const showEditForm = async (req, res, next) => {
  try {
    const trip = await tripService.findByIdForOwner({
      id: req.params.id,
      userId: req.session.user._id,
    });

    return res.render("trip/user/edit", {
      title: "Edit Dinas Luar",
      trip,
    });
  } catch (err) {
    next(err);
  }
};

/* ---------------- UPDATE ---------------- */
export const update = async (req, res, next) => {
  try {
    await tripService.update({
      id: req.params.id,
      user: req.session.user,
      body: req.body,
    });

    return res.redirect("/trip/user/my");
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

/* ---------------- APPROVAL ACTION ---------------- */
export const handleApproval = async (req, res, next) => {
  try {
    const result = await tripService.handleApproval({
      id: req.params.id,
      user: req.session.user,
      body: req.body,
    });

    return res.json(result);
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

/* ---------------- DELEGATION ---------------- */
export const delegateToHR = async (req, res, next) => {
  try {
    await tripService.delegateToHR({
      id: req.params.id,
      user: req.session.user,
    });

    return res.redirect("/trip/approval");
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

/* ---------------- REPORT ---------------- */
export const reportPage = async (req, res, next) => {
  try {
    const result = await tripService.report(req.session.user);

    return res.render("trip/report", {
      title: "Laporan Dinas Luar",
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/* ---------------- FINANCE ---------------- */
export const financePage = async (req, res, next) => {
  try {
    const trips = await tripService.findApprovedForFinance();

    return res.render("trip/finance", {
      title: "Finance Trip",
      trips,
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};

/* ---------------- PAYMENT ---------------- */
export const confirmPayment = async (req, res, next) => {
  try {
    await tripService.confirmPayment({
      id: req.params.id,
      user: req.session.user,
    });

    return res.redirect("/trip/finance");
  } catch (err) {
    next(err);
  }
};

/* ---------------- HISTORY ---------------- */
export const paymentHistoryPage = async (req, res, next) => {
  try {
    const result = await tripService.paymentHistory(req.session.user);

    return res.render("trip/finance/history", {
      title: "Riwayat Pembayaran",
      ...result,
    });
  } catch (err) {
    next(err);
  }
};
