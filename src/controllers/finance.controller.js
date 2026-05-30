import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import BusinessTrip from "../models/BusinessTrip.model.js";
import { getFinanceTripDetailService } from "../services/finance.service.js";

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

    trip.payment.status = "PROCESSING";

    await trip.save();

    return res.redirect(`/finance/${trip._id}`);
  } catch (err) {
    next(err);
  }
};

export const confirmPayment = async (req, res, next) => {
  try {
    const trip = await BusinessTrip.findById(req.params.id);

    if (!trip) {
      return res.status(404).send("Trip not found");
    }

    if (!trip.payment?.proof?.filename) {
      return res.status(400).send("Payment proof required");
    }

    if (trip.payment?.status === "PAID") {
      return res.status(400).send("Payment already confirmed");
    }

    trip.payment.status = "PAID";
    trip.payment.paidAt = new Date();
    trip.payment.paidBy = req.user?._id;

    trip.status = "READY_TO_TRAVEL";

    await trip.save();

    return res.redirect(`/finance/${trip._id}`);
  } catch (err) {
    next(err);
  }
};

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

export const financeTripPage = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination({
      page: req.query.page,
      limit: 10,
    });

    const query = {
      status: "APPROVED",
      "payment.status": {
        $in: ["PENDING", "PROCESSING", "FAILED"],
      },
    };

    const [trips, total] = await Promise.all([
      BusinessTrip.find(query)
        .populate("userId", "username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      BusinessTrip.countDocuments(query),
    ]);

    const pagination = getPaginationMeta({
      page,
      limit,
      total,
    });

    return res.render("trip/finance/index", {
      title: "Finance Trips",
      trips,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};
export const paymentHistoryPage = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination({
      page: req.query.page,
      limit: 10,
    });

    const query = {
      "payment.status": "PAID",
    };

    const [trips, total] = await Promise.all([
      BusinessTrip.find(query)
        .populate("userId", "username roleId")
        .populate("payment.paidBy", "username")
        .sort({ "payment.paidAt": -1 })
        .skip(skip)
        .limit(limit),

      BusinessTrip.countDocuments(query),
    ]);

    const pagination = getPaginationMeta({
      page,
      limit,
      total,
    });

    return res.render("trip/finance/history", {
      title: "Payment History",
      user: req.session.user,
      trips,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};
export const paymentHistoryDetail = async (req, res, next) => {
  try {
    const trip = await BusinessTrip.findById(req.params.id)
      .populate("userId", "username email role")
      .populate("payment.paidBy", "username");

    if (!trip) {
      return res.status(404).send("Not found");
    }

    if (trip.payment?.status !== "PAID") {
      return res.status(400).send("Not a paid transaction");
    }

    return res.render("trip/finance/history-detail", {
      title: "Payment Detail",
      trip,
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};
