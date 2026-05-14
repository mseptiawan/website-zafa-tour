import BusinessTrip from "../models/BusinessTrip.js";

/* =========================
   HALAMAN FORM PENGAJUAN
========================= */

/* =========================
   HALAMAN FORM PENGAJUAN
========================= */
export const formRequest = (req, res) => {
  res.render("trip/request", {
    title: "Pengajuan Dinas Luar",
  });
};

export const createTrip = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user) {
      return res.status(401).send("Session tidak valid");
    }

    // =========================
    // ROLE FROM SESSION (ALWAYS UPPERCASE)
    // =========================
    const role = user.role;
    // MANAGER | HR | PIMPINAN | KARYAWAN | KEUANGAN

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

    // =========================
    // NORMALIZATION
    // =========================
    title = title?.trim();
    destination = destination?.trim();
    description = description?.trim();
    budget = Number(budget);

    // =========================
    // TIMELINE NORMALIZATION
    // =========================
    if (!Array.isArray(timeline)) {
      timeline = timeline ? [timeline] : [];
    }

    const normalizedTimeline = timeline
      .map((t, index) => {
        const address = typeof t === "string" ? t : t?.address || t?.trim?.();

        return {
          address,
          order: index + 1,
        };
      })
      .filter((t) => t.address);

    // =========================
    // VALIDATION
    // =========================
    if (!title || title.length < 5) {
      return res.status(400).send("Judul minimal 5 karakter");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end) || start > end) {
      return res.status(400).send("Tanggal tidak valid");
    }

    if (!destination || destination.length < 3) {
      return res.status(400).send("Destination tidak valid");
    }

    if (!description || description.length < 10) {
      return res.status(400).send("Deskripsi terlalu pendek");
    }

    if (isNaN(budget) || budget < 0) {
      return res.status(400).send("Budget tidak valid");
    }

    if (normalizedTimeline.length === 0) {
      return res.status(400).send("Timeline wajib diisi");
    }

    // =========================
    // CONTACT PERSON
    // =========================
    const contact = {
      name: contactPerson?.name?.trim() || null,
      phone: contactPerson?.phone?.trim() || null,
    };

    // =========================
    // WORKFLOW ROUTING ENGINE (BASED ON UPPERCASE ROLE)
    // =========================
    let currentStep = "MANAGER";

    let status = "PENDING";

    // =========================
    // ROLE RULES
    // =========================

    // manager submit → langsung ke pimpinan
    if (role === "MANAGER") {
      currentStep = "PIMPINAN";
      status = "IN_REVIEW";
    }

    // HR submit → tetap manager dulu
    if (role === "HR") {
      currentStep = "MANAGER";
      status = "PENDING";
    }

    // karyawan & keuangan
    if (role === "KARYAWAN" || role === "KEUANGAN") {
      currentStep = "MANAGER";
      status = "PENDING";
    }

    // =========================
    // CREATE DOCUMENT
    // =========================
    const trip = await BusinessTrip.create({
      userId: user._id,

      title,
      purpose,

      startDate: start,
      endDate: end,

      destination,
      description,

      budget,

      contactPerson: contact,

      timeline: normalizedTimeline,

      // =========================
      // WORKFLOW STATE
      // =========================
      status,
      currentStep,

      approvals: [],

      delegation: {
        active: false,
      },
    });

    return res.redirect("/trip/my");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Gagal membuat pengajuan");
  }
};

export const approvalPage = async (req, res) => {
  try {
    const user = req.session.user;

    const role = user.role;

    // =========================
    // FILTER
    // =========================
    let filter = {};

    // =========================
    // MANAGER
    // =========================
    if (role === "MANAGER") {
      filter = {
        status: {
          $in: ["PENDING", "IN_REVIEW"],
        },

        currentStep: "MANAGER",
      };
    }

    // =========================
    // PIMPINAN
    // =========================
    else if (role === "PIMPINAN") {
      filter = {
        status: {
          $in: ["PENDING", "IN_REVIEW"],
        },

        currentStep: "PIMPINAN",
      };
    }

    // =========================
    // HR (delegation only)
    // =========================
    else if (role === "HR") {
      filter = {
        status: {
          $in: ["PENDING", "IN_REVIEW"],
        },

        currentStep: "PIMPINAN",

        "delegation.active": true,

        "delegation.to": "HR",
      };
    }

    // =========================
    // NO ACCESS
    // =========================
    else {
      return res.status(403).send("Tidak memiliki akses approval");
    }

    // =========================
    // GET DATA
    // =========================
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

    // =========================
    // RENDER
    // =========================
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

  // hanya boleh edit sebelum IN_REVIEW
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

  // normalize
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

    // action:
    // APPROVE
    // REJECT
    // DELEGATE_TO_HR

    const { action, note } = req.body;

    const trip = await BusinessTrip.findById(id);

    if (!trip) {
      return res.status(404).send("Data tidak ditemukan");
    }

    const role = user.role;

    const currentStep = trip.currentStep;

    // =========================
    // ROLE CHECK
    // =========================

    const isManager = role === "MANAGER";

    const isPimpinan = role === "PIMPINAN";

    const isHRDelegatedAsPimpinan =
      role === "HR" && currentStep === "PIMPINAN" && trip.delegation?.active === true;

    // =========================
    // AUTHORIZATION
    // =========================

    if (currentStep === "MANAGER" && !isManager) {
      return res.status(403).send("Hanya Manager yang bisa approve tahap ini");
    }

    if (currentStep === "PIMPINAN" && !isPimpinan && !isHRDelegatedAsPimpinan) {
      return res.status(403).send("Tidak memiliki akses approval pimpinan");
    }

    // =========================
    // DELEGATE TO HR
    // =========================
    // hanya pimpinan yg bisa delegasi

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

    // =========================
    // REJECT
    // =========================

    if (action === "REJECT") {
      if (!note || note.trim().length < 5) {
        return res.status(400).send("Alasan reject minimal 5 karakter");
      }

      trip.approvals.push({
        role: currentStep,

        // siapa yg bertindak
        actingAs: role,

        userId: user._id,

        status: "REJECTED",

        date: new Date(),

        note,
      });

      trip.status = "REJECTED";

      trip.currentStep = null;

      // delegation dimatikan
      if (trip.delegation) {
        trip.delegation.active = false;
      }

      await trip.save();

      return res.json({
        message: "Pengajuan berhasil ditolak",
      });
    }

    // =========================
    // APPROVE
    // =========================

    if (action === "APPROVE") {
      trip.approvals.push({
        role: currentStep,

        actingAs: role,

        userId: user._id,

        status: "APPROVED",

        date: new Date(),
      });

      // =========================
      // FLOW
      // =========================

      // manager approve
      if (currentStep === "MANAGER") {
        trip.currentStep = "PIMPINAN";

        trip.status = "IN_REVIEW";
      }

      // pimpinan / HR delegated approve final
      else if (currentStep === "PIMPINAN") {
        trip.currentStep = null;

        trip.status = "APPROVED";

        // selesai → delegation off
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

    // reset workflow
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

  // hanya pending/rejected boleh edit
  if (trip.status !== "PENDING" && trip.status !== "REJECTED") {
    return res.status(403).send("Tidak dapat edit pengajuan ini");
  }

  await BusinessTrip.findByIdAndUpdate(id, {
    ...req.body,

    // reset workflow
    status: "PENDING",
    currentStep: "MANAGER",

    // audit trail tetap disimpan
    updatedAt: new Date(),
  });

  return res.redirect("/trip/my");
};

export const delegateTripToHR = async (req, res) => {
  try {
    const user = req.session.user;

    const { id } = req.params;

    // =========================
    // ONLY PIMPINAN
    // =========================
    if (user.role !== "PIMPINAN") {
      return res.status(403).send("Hanya pimpinan yang dapat melakukan delegasi");
    }

    // =========================
    // FIND TRIP
    // =========================
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

    // =========================
    // VALID STEP
    // =========================
    if (trip.currentStep !== "PIMPINAN") {
      return res.status(400).send("Pengajuan tidak berada pada tahap pimpinan");
    }

    // =========================
    // HR CANNOT APPROVE OWN REQUEST
    // =========================
    if (trip.userId?.roleId?.name === "HR") {
      return res.status(403).send("Pengajuan HR tidak boleh didelegasikan ke HR");
    }

    // =========================
    // ALREADY DELEGATED
    // =========================
    if (trip.delegation?.active) {
      return res.status(400).send("Pengajuan sudah didelegasikan");
    }

    // =========================
    // CREATE DELEGATION
    // =========================
    trip.delegation = {
      from: "PIMPINAN",
      to: "HR",

      active: true,

      createdBy: user._id,

      createdAt: new Date(),

      note: "Delegasi approval ke HR",
    };

    // tetap di tahap pimpinan
    trip.currentStep = "PIMPINAN";

    // tetap review
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

    // =========================
    // KARYAWAN ONLY OWN DATA
    // =========================
    if (role === "KARYAWAN") {
      filter.userId = user._id;
    }

    // =========================
    // LOAD DATA
    // =========================
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

/* =========================
   CONFIRM PAYMENT
========================= */
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

    // filter dasar
    let filter = {
      status: "APPROVED",
    };

    // optional: kalau kamu mau karyawan tidak lihat semua
    // tapi kamu request MANAGER/HR/PIMPINAN jadi semua boleh lihat

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
