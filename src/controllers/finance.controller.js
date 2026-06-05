import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import BusinessTrip from "../models/BusinessTrip.model.js";
import { getFinanceTripDetailService } from "../services/finance.service.js";
import Payroll from "../models/payroll/Payroll.model.js";
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
      status: "PAYMENT_PROCESSING",
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
export const getFinancePage = async (req, res) => {
  try {
    // Ambil list periode untuk dropdown filter
    const availablePeriods = ["2026-06", "2026-05", "2026-04"];
    const currentPeriod = "2026-06";

    // DI SINI TEMPAT NYA RES.RENDER UNTUK HALAMAN FINANCE
    res.render("payroll/finance", {
      title: "Verifikasi Pembayaran Finance",
      availablePeriods,
      currentPeriod,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
export const getAllPayrollRecords = async (req, res) => {
  try {
    const { period } = req.query;

    if (!period) {
      return res
        .status(400)
        .json({ success: false, message: "Parameter periode bulan wajib diisi." });
    }

    // Ambil data payroll bulanan, join dengan data Employee untuk dapet Nama & NIK
    const payrolls = await Payroll.find({ periodMonth: period })
      .populate({
        path: "employeeId",
        select: "fullName employeeIdNumber",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: payrolls,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. Verifikasi Pembayaran Individu + Upload Bukti Mutasi (Mark as Paid)
 */
export const verifyIndividualPayment = async (req, res) => {
  try {
    const { employeeId, periodMonth } = req.body;

    if (!employeeId || !periodMonth) {
      return res.status(400).json({ success: false, message: "Data verifikasi tidak lengkap." });
    }

    // Ambil path file jika finance mengunggah bukti mutasi bank
    let mutationFilePath = null;
    if (req.file) {
      mutationFilePath = `/uploads/files/${req.file.filename}`;
    }

    // Update status payroll dari CLOSED menjadi PAID
    const updatedPayroll = await Payroll.findOneAndUpdate(
      { employeeId, periodMonth, status: "CLOSED" },
      {
        $set: {
          status: "PAID",
          paidAt: new Date(),
          // Kita simpan dinamis path file mutasinya di field tambahan (jika diunggah)
          mutationFile: mutationFilePath || "/uploads/files/default-receipt.pdf",
        },
      },
      { new: true }
    );

    if (!updatedPayroll) {
      return res.status(404).json({
        success: false,
        message: "Data payroll berstatus CLOSED tidak ditemukan untuk pegawai ini.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payroll berhasil dicairkan dan ditandai Lunas!",
      data: updatedPayroll,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
