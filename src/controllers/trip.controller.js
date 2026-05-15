import {
  getEditableTripService,
  updateTripService,
  approvalPageService,
  handleApprovalService,
  confirmPaymentService,
} from "../services/trip.service.js";

export const newForm = (req, res) => {
  res.render("trip/user/create", { title: "Pengajuan Dinas Luar", error: null });
};

export const create = async (req, res) => {
  res.redirect("/trip/user/my");
};
export const editTripForm = async (req, res) => {
  try {
    const trip = await getEditableTripService({
      id: req.params.id,
      userId: req.session.user._id,
    });

    res.render("trip/edit", {
      title: "Edit Trip",
      trip,
    });
  } catch (err) {
    if (err.message === "NOT_FOUND") return res.status(404).send("Not found");

    if (err.message === "LOCKED") return res.status(403).send("Locked");

    return res.status(500).send("Server error");
  }
};

export const updateTrip = async (req, res) => {
  try {
    await updateTripService({
      id: req.params.id,
      userId: req.session.user._id,
      body: req.body,
    });

    return res.redirect("/trip/my");
  } catch (err) {
    if (err.message === "NOT_FOUND") return res.status(404).send("Not found");

    if (err.message === "LOCKED") return res.status(403).send("Locked");

    return res.status(500).send("Server error");
  }
};

export const approvalPage = async (req, res) => {
  try {
    const trips = await approvalPageService(req.session.user);

    res.render("trip/approval", {
      title: "Approval",
      trips,
      user: req.session.user,
    });
  } catch {
    res.status(403).send("Forbidden");
  }
};
export const handleApproval = async (req, res) => {
  try {
    await handleApprovalService({
      id: req.params.id,
      user: req.session.user,
      action: req.body.action,
      note: req.body.note,
    });

    res.json({ message: "OK" });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

export const reportTripPage = async (req, res) => {
  res.render("trip/report", {
    title: "Report",
    user: req.session.user,
  });
};

export const delegateTripToHR = async (req, res) => {
  res.redirect("/trip/approval");
};

export const financeTripPage = async (req, res) => {
  res.render("trip/finance", {
    title: "Finance",
    user: req.session.user,
  });
};

export const confirmPayment = async (req, res) => {
  try {
    await confirmPaymentService({
      id: req.params.id,
      user: req.session.user,
    });

    res.redirect("/finance/trips");
  } catch (err) {
    res.status(400).send(err.message);
  }
};

export const paymentHistoryPage = async (req, res) => {
  res.render("trip/payment-history", {
    title: "Payment History",
    user: req.session.user,
  });
};

export const myTrips = async (req, res) => {
  res.render("trip/my", {
    title: "My Trips",
  });
};
