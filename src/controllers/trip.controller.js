import {
  createTripService,
  approvalPageService,
  updateTripService,
  handleApprovalService,
  confirmPaymentService,
} from "../services/trip.service.js";

/* =========================
FORM
========================= */
export const newForm = (req, res) => {
  res.render("trip/request", { title: "Pengajuan Dinas Luar" });
};

/* =========================
CREATE
========================= */
export const create = async (req, res) => {
  try {
    const trip = await createTripService({
      user: req.session.user,
      body: req.body,
    });

    return res.redirect("/trip/my");
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

/* =========================
APPROVAL PAGE
========================= */
export const approvalPage = async (req, res) => {
  try {
    const trips = await approvalPageService(req.session.user);

    return res.render("trip/approval", {
      title: "Approval Dinas Luar",
      trips,
      user: req.session.user,
    });
  } catch (err) {
    if (err.message === "FORBIDDEN") {
      return res.status(403).send("Tidak memiliki akses approval");
    }
    return res.status(500).send("Error load approval page");
  }
};

/* =========================
EDIT FORM
========================= */
export const editTripForm = async (req, res) => {
  const trip = await BusinessTrip.findOne({
    _id: req.params.id,
    userId: req.session.user._id,
  });

  if (!trip) return res.status(404).send("Not found");

  if (trip.status !== "PENDING" && trip.status !== "REJECTED") {
    return res.status(403).send("Locked");
  }

  res.render("trip/edit", { title: "Edit", trip });
};

/* =========================
UPDATE
========================= */
export const updateTrip = async (req, res) => {
  try {
    await updateTripService({
      id: req.params.id,
      userId: req.session.user._id,
      body: req.body,
    });

    return res.redirect("/trip/my");
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

/* =========================
APPROVAL ACTION
========================= */
export const handleApproval = async (req, res) => {
  try {
    const result = await handleApprovalService({
      id: req.params.id,
      user: req.session.user,
      action: req.body.action,
      note: req.body.note,
    });

    return res.json(result);
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

/* =========================
RESUBMIT
========================= */
export const resubmitTrip = async (req, res) => {
  const trip = await BusinessTrip.findById(req.params.id);

  if (!trip) return res.status(404).send("Not found");

  if (trip.status !== "REJECTED") {
    return res.status(400).send("Invalid state");
  }

  trip.status = "PENDING";
  trip.currentStep = "MANAGER";
  await trip.save();

  return res.json({ message: "Resubmitted" });
};

/* =========================
MY TRIPS
========================= */
export const myTrips = async (req, res) => {
  const trips = await BusinessTrip.find({
    userId: req.session.user._id,
  }).sort({ createdAt: -1 });

  res.render("trip/my", { title: "Perjalanan Saya", trips });
};

/* =========================
SHOW EDIT
========================= */
export const showEditTrip = async (req, res) => {
  const trip = await BusinessTrip.findOne({
    _id: req.params.id,
    userId: req.session.user._id,
  });

  if (!trip) return res.status(404).send("Not found");

  res.render("trip/edit", { title: "Edit", trip });
};

/* =========================
RESUBMIT UPDATE
========================= */
export const resubmitUpdateTrip = async (req, res) => {
  const trip = await BusinessTrip.findOne({
    _id: req.params.id,
    userId: req.session.user._id,
  });

  if (!trip) return res.status(404).send("Not found");

  if (trip.status !== "PENDING" && trip.status !== "REJECTED") {
    return res.status(403).send("Locked");
  }

  await BusinessTrip.findByIdAndUpdate(req.params.id, {
    ...req.body,
    status: "PENDING",
    currentStep: "MANAGER",
    updatedAt: new Date(),
  });

  return res.redirect("/trip/my");
};

/* =========================
DELEGATE
========================= */
export const delegateTripToHR = async (req, res) => {
  const user = req.session.user;

  if (user.role !== "PIMPINAN") {
    return res.status(403).send("Forbidden");
  }

  const trip = await BusinessTrip.findById(req.params.id);

  if (!trip) return res.status(404).send("Not found");

  if (trip.currentStep !== "PIMPINAN") {
    return res.status(400).send("Invalid step");
  }

  if (trip.delegation?.active) {
    return res.status(400).send("Already delegated");
  }

  trip.delegation = {
    from: "PIMPINAN",
    to: "HR",
    active: true,
    createdBy: user._id,
    createdAt: new Date(),
    note: "Delegasi approval ke HR",
  };

  await trip.save();

  return res.redirect("/trip/approval");
};

/* =========================
REPORT
========================= */
export const reportTripPage = async (req, res) => {
  const filter = {};

  if (req.session.user.role === "KARYAWAN") {
    filter.userId = req.session.user._id;
  }

  const trips = await BusinessTrip.find(filter);

  res.render("trip/report", {
    title: "Laporan",
    trips,
    user: req.session.user,
  });
};

/* =========================
FINANCE
========================= */
export const financeTripPage = async (req, res) => {
  const trips = await BusinessTrip.find({
    status: "APPROVED",
  });

  res.render("trip/finance", {
    title: "Finance",
    trips,
    user: req.session.user,
  });
};

/* =========================
PAYMENT
========================= */
export const confirmPayment = async (req, res) => {
  try {
    await confirmPaymentService({
      id: req.params.id,
      user: req.session.user,
    });

    return res.redirect("/finance/trips");
  } catch (err) {
    return res.status(400).send(err.message);
  }
};

/* =========================
PAYMENT HISTORY
========================= */
export const paymentHistoryPage = async (req, res) => {
  const trips = await BusinessTrip.find({
    status: "APPROVED",
  })
    .populate("paidBy", "username")
    .sort({ createdAt: -1 });

  res.render("trip/payment-history", {
    title: "Payment History",
    trips,
    user: req.session.user,
  });
};
