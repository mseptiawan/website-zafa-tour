import BusinessTrip from "../models/BusinessTrip.js";

export const getFinanceTripDetailService = async ({ id }) => {
  const trip = await BusinessTrip.findById(id).populate("userId", "username email");

  if (!trip) {
    const err = new Error("Trip tidak ditemukan");
    err.status = 404;
    throw err;
  }

  // validasi domain finance
  const isFinanceEligible =
    trip.status === "APPROVED" &&
    ["PENDING", "PROCESSING", "FAILED", "PAID"].includes(trip.payment?.status);

  if (!isFinanceEligible) {
    const err = new Error("Trip tidak tersedia untuk finance");
    err.status = 403;
    throw err;
  }

  return trip;
};

export const uploadPaymentProofService = async ({ id, file }) => {
  const trip = await BusinessTrip.findById(id);

  if (!trip) throw new Error("Trip tidak ditemukan");

  const url = `/uploads/files/${file.filename}`;

  trip.payment = {
    ...trip.payment,
    status: "PROCESSING",
    proof: {
      filename: file.filename,
      url,
      uploadedAt: new Date(),
    },
  };

  await trip.save();

  return trip;
};
