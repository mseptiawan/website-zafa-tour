import BusinessTrip from "../models/BusinessTrip.js";
import { getFinanceTripDetailService } from "../services/finance.service.js";

/**
 * PROCESS PAYMENT
 */
export const processPayment = async (req, res) => {
  const trip = await BusinessTrip.findById(req.params.id);

  trip.payment.status = "PROCESSING";
  trip.payment.processedAt = new Date();
  trip.payment.processedBy = req.user._id;

  await trip.save();

  res.redirect(`/finance/${trip._id}`);
};

export const uploadPaymentProof = async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send("No file uploaded");
    }

    const trip = await BusinessTrip.findById(req.params.id);

    if (!trip) {
      return res.status(404).send("Trip not found");
    }

    trip.payment.proof = {
      filename: file.filename,
      url: `/uploads/files/${file.filename}`,
      uploadedAt: new Date(),
    };

    // optional safety: pastikan tetap PROCESSING
    trip.payment.status = "PROCESSING";

    await trip.save();

    return res.redirect(`/finance/${trip._id}`);
  } catch (err) {
    next(err);
  }
};

/**
 * CONFIRM PAYMENT
 */
export const confirmPayment = async (req, res, next) => {
  try {
    const trip = await BusinessTrip.findById(req.params.id);

    if (!trip) {
      return res.status(404).send("Trip not found");
    }

    // safety guard: harus ada proof dulu
    if (!trip.payment?.proof) {
      return res.status(400).send("Payment proof required");
    }

    trip.payment.status = "PAID";
    trip.payment.paidAt = new Date();
    trip.payment.paidBy = req.user?._id;

    await trip.save();

    return res.redirect(`/finance/${trip._id}`);
  } catch (err) {
    next(err);
  }
};

/**
 * FINANCE DETAIL PAGE
 */
export const financeTripDetail = async (req, res, next) => {
  try {
    const trip = await getFinanceTripDetailService({
      id: req.params.id,
    });

    if (!trip) {
      return res.status(404).render("errors/404", {
        title: "Not Found",
        message: "Trip tidak ditemukan",
      });
    }

    return res.render("trip/finance/finance-detail", {
      title: "Finance Detail",
      trip,
      error: null,
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * FINANCE LIST PAGE
 */
export const financeTripPage = async (req, res, next) => {
  try {
    const trips = await BusinessTrip.find({
      status: "APPROVED",
      "payment.status": {
        $in: ["PENDING", "PROCESSING", "FAILED"],
      },
    })
      .populate("userId", "username")
      .sort({ createdAt: -1 });

    return res.render("trip/finance/index", {
      title: "Finance Trips",
      trips,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PAYMENT HISTORY PAGE
 */
export const paymentHistoryPage = async (req, res, next) => {
  try {
    return res.render("trip/payment-history", {
      title: "Payment History",
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};
