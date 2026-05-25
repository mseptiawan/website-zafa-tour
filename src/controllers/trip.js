import BusinessTrip from "../models/BusinessTrip.js";

export const formRequest = (req, res) => {
  res.render("trip/request", {
    title: "Pengajuan Dinas Luar",
  });
};

export const approvalPage = async (req, res) => {
  try {
    const user = req.session.user;

    const role = user.role;

    let filter = {};

    if (role === "MANAGER") {
      filter = {
        status: {
          $in: ["PENDING", "IN_REVIEW"],
        },

        currentStep: "MANAGER",
      };
    } else if (role === "PIMPINAN") {
      filter = {
        status: {
          $in: ["PENDING", "IN_REVIEW"],
        },

        currentStep: "PIMPINAN",
      };
    } else if (role === "HR") {
      filter = {
        status: {
          $in: ["PENDING", "IN_REVIEW"],
        },

        currentStep: "PIMPINAN",

        "delegation.active": true,

        "delegation.to": "HR",
      };
    } else {
      return res.status(403).send("Tidak memiliki akses approval");
    }

    const trips = await BusinessTrip.find(filter)
      .populate({
        path: "userId",
        select: "username roleId",
        populate: {
          path: "roleId",
          select: "name",
        },
      })
      .sort({ createdAt: -1 });

    return res.render("trip/approval", {
      title: "Approval Dinas Luar",
      trips,
      user,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).send("Error load approval page");
  }
};
export const editTripForm = async (req, res) => {
  const user = req.session.user;
  const { id } = req.params;

  const trip = await BusinessTrip.findOne({
    _id: id,
    userId: user._id,
  });

  if (!trip) return res.status(404).send("Not found");

  if (trip.status !== "PENDING" && trip.status !== "REJECTED") {
    return res.status(403).send("Tidak bisa edit saat sudah diproses approval");
  }

  res.render("trip/edit", {
    title: "Edit Pengajuan Dinas Luar",
    trip,
  });
};

export const updateTrip = async (req, res) => {
  const user = req.session.user;
  const { id } = req.params;

  const trip = await BusinessTrip.findOne({
    _id: id,
    userId: user._id,
  });

  if (!trip) return res.status(404).send("Not found");

  if (trip.status !== "PENDING" && trip.status !== "REJECTED") {
    return res.status(403).send("Tidak bisa edit setelah masuk approval");
  }

  let {
    title,
    purpose,
    startDate,
    endDate,
    destination,
    description,
    budget,
    contactPerson,
    timeline,
  } = req.body;

  budget = Number(budget);

  if (!Array.isArray(timeline)) {
    timeline = timeline ? [timeline] : [];
  }

  const normalizedTimeline = timeline.map((t, i) => ({
    address: typeof t === "string" ? t : t.address,
    order: i + 1,
  }));

  await BusinessTrip.findByIdAndUpdate(id, {
    title,
    purpose,
    startDate,
    endDate,
    destination,
    description,
    budget,
    contactPerson,
    timeline: normalizedTimeline,
  });

  return res.redirect("/trip/my");
};
export const handleApproval = async (req, res) => {
  try {
    const user = req.session.user;
    const { id } = req.params;

    const { action, note } = req.body;

    const trip = await BusinessTrip.findById(id);

    if (!trip) {
      return res.status(404).send("Data tidak ditemukan");
    }

    const role = user.role;

    const currentStep = trip.currentStep;

    const isManager = role === "MANAGER";

    const isPimpinan = role === "PIMPINAN";

    const isHRDelegatedAsPimpinan =
      role === "HR" && currentStep === "PIMPINAN" && trip.delegation?.active === true;

    if (currentStep === "MANAGER" && !isManager) {
      return res.status(403).send("Hanya Manager yang bisa approve tahap ini");
    }

    if (currentStep === "PIMPINAN" && !isPimpinan && !isHRDelegatedAsPimpinan) {
      return res.status(403).send("Tidak memiliki akses approval pimpinan");
    }

    if (action === "DELEGATE_TO_HR") {
      if (!isPimpinan) {
        return res.status(403).send("Hanya pimpinan yang bisa mendelegasikan");
      }

      trip.delegation = {
        from: "PIMPINAN",
        to: "HR",
        active: true,
        createdBy: user._id,
        createdAt: new Date(),
        note: note || "Delegasi approval ke HR",
      };

      await trip.save();

      return res.json({
        message: "Approval berhasil didelegasikan ke HR",
      });
    }

    if (action === "REJECT") {
      if (!note || note.trim().length < 5) {
        return res.status(400).send("Alasan reject minimal 5 karakter");
      }

      trip.approvals.push({
        role: currentStep,

        actingAs: role,

        userId: user._id,

        status: "REJECTED",

        date: new Date(),

        note,
      });

      trip.status = "REJECTED";

      trip.currentStep = null;

      if (trip.delegation) {
        trip.delegation.active = false;
      }

      await trip.save();

      return res.json({
        message: "Pengajuan berhasil ditolak",
      });
    }

    if (action === "APPROVE") {
      trip.approvals.push({
        role: currentStep,

        actingAs: role,

        userId: user._id,

        status: "APPROVED",

        date: new Date(),
      });

      if (currentStep === "MANAGER") {
        trip.currentStep = "PIMPINAN";

        trip.status = "IN_REVIEW";
      } else if (currentStep === "PIMPINAN") {
        trip.currentStep = null;

        trip.status = "APPROVED";

        if (trip.delegation) {
          trip.delegation.active = false;
        }
      }

      await trip.save();

      return res.json({
        message: "Pengajuan berhasil disetujui",
      });
    }

    return res.status(400).send("Action tidak valid");
  } catch (err) {
    console.error(err);

    return res.status(500).send("Server error");
  }
};

export const resubmitTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await BusinessTrip.findById(id);

    if (!trip) {
      return res.status(404).send("Not found");
    }

    if (trip.status !== "REJECTED") {
      return res.status(400).send("Hanya data rejected yang bisa di-resubmit");
    }

    trip.status = "PENDING";
    trip.currentStep = "MANAGER";

    await trip.save();

    return res.json({ message: "Resubmitted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  }
};

export const myTrips = async (req, res) => {
  try {
    const user = req.session.user;

    const trips = await BusinessTrip.find({
      userId: user._id,
    }).sort({ createdAt: -1 });

    res.render("trip/my", {
      title: "Perjalanan Saya",
      trips,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error load data");
  }
};

export const showEditTrip = async (req, res) => {
  const user = req.session.user;

  const trip = await BusinessTrip.findOne({
    _id: req.params.id,
    userId: user._id,
  });

  if (!trip) {
    return res.status(404).send("Data tidak ditemukan");
  }

  res.render("trip/edit", {
    title: "Edit Dinas Luar",
    trip,
  });
};

export const resubmitUpdateTrip = async (req, res) => {
  const user = req.session.user;
  const { id } = req.params;

  const trip = await BusinessTrip.findOne({
    _id: id,
    userId: user._id,
  });

  if (!trip) {
    return res.status(404).send("Data tidak ditemukan");
  }

  if (trip.status !== "PENDING" && trip.status !== "REJECTED") {
    return res.status(403).send("Tidak dapat edit pengajuan ini");
  }

  await BusinessTrip.findByIdAndUpdate(id, {
    ...req.body,

    status: "PENDING",
    currentStep: "MANAGER",

    updatedAt: new Date(),
  });

  return res.redirect("/trip/my");
};

export const delegateTripToHR = async (req, res) => {
  try {
    const user = req.session.user;

    const { id } = req.params;

    if (user.role !== "PIMPINAN") {
      return res.status(403).send("Hanya pimpinan yang dapat melakukan delegasi");
    }

    const trip = await BusinessTrip.findById(id).populate({
      path: "userId",
      select: "username roleId",
      populate: {
        path: "roleId",
        select: "name",
      },
    });

    if (!trip) {
      return res.status(404).send("Pengajuan tidak ditemukan");
    }

    if (trip.currentStep !== "PIMPINAN") {
      return res.status(400).send("Pengajuan tidak berada pada tahap pimpinan");
    }

    if (trip.userId?.roleId?.name === "HR") {
      return res.status(403).send("Pengajuan HR tidak boleh didelegasikan ke HR");
    }

    if (trip.delegation?.active) {
      return res.status(400).send("Pengajuan sudah didelegasikan");
    }

    trip.delegation = {
      from: "PIMPINAN",
      to: "HR",

      active: true,

      createdBy: user._id,

      createdAt: new Date(),

      note: "Delegasi approval ke HR",
    };

    trip.currentStep = "PIMPINAN";

    trip.status = "IN_REVIEW";

    await trip.save();

    return res.redirect("/trip/approval");
  } catch (err) {
    console.error(err);

    return res.status(500).send("Server error");
  }
};

export const reportTripPage = async (req, res) => {
  try {
    const user = req.session.user;

    const role = user.role;

    const filter = {};

    if (role === "Pegawai") {
      filter.userId = user._id;
    }

    const trips = await BusinessTrip.find(filter)
      .populate({
        path: "userId",
        select: "username roleId",
        populate: {
          path: "roleId",
          select: "name",
        },
      })
      .sort({ createdAt: -1 });

    return res.render("trip/report", {
      title: "Laporan Dinas Luar",
      trips,
      user,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).send("Gagal memuat laporan");
  }
};

export const financeTripPage = async (req, res) => {
  try {
    const trips = await BusinessTrip.find({
      status: "APPROVED",
    })
      .populate({
        path: "userId",
        select: "username roleId",
        populate: {
          path: "roleId",
          select: "name",
        },
      })
      .sort({ createdAt: -1 });

    return res.render("trip/finance", {
      title: "Permintaan Pembayaran Dinas Luar",
      trips,
      user: req.session.user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Gagal load data finance");
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    const trip = await BusinessTrip.findById(id);

    if (!trip) {
      return res.status(404).send("Data tidak ditemukan");
    }

    if (trip.status !== "APPROVED") {
      return res.status(400).send("Hanya data APPROVED yang bisa dibayar");
    }

    trip.paymentStatus = "PAID";
    trip.paidAt = new Date();
    trip.paidBy = user._id;

    await trip.save();

    return res.redirect("/finance/trips");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  }
};

export const paymentHistoryPage = async (req, res) => {
  try {
    const user = req.session.user;

    const role = user.role;

    let filter = {
      status: "APPROVED",
    };

    const trips = await BusinessTrip.find(filter)
      .populate({
        path: "userId",
        select: "username roleId",
        populate: {
          path: "roleId",
          select: "name",
        },
      })
      .populate("paidBy", "username")
      .sort({ createdAt: -1 });

    return res.render("trip/payment-history", {
      title: "Riwayat Pembayaran Dinas Luar",
      trips,
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Gagal load riwayat pembayaran");
  }
};
