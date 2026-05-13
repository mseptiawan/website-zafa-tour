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

    // RULE ENGINE HRIS
    if (role === "MANAGER") {
      currentStep = "PIMPINAN";
    }

    if (role === "HR") {
      currentStep = "MANAGER";
    }

    // KARYAWAN & KEUANGAN default
    if (role === "KARYAWAN" || role === "KEUANGAN") {
      currentStep = "MANAGER";
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
      status: "PENDING",
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
    // FILTER WORKFLOW
    // =========================
    const filter = {
      status: { $in: ["PENDING", "IN_REVIEW"] },
    };

    // MANAGER hanya lihat step MANAGER
    if (role === "MANAGER") {
      filter.currentStep = "MANAGER";
    }

    // PIMPINAN + HR (delegation) lihat step PIMPINAN
    if (role === "PIMPINAN" || role === "HR") {
      filter.currentStep = "PIMPINAN";
    }

    const trips = await BusinessTrip.find(filter)
      .populate("userId", "username")
      .sort({ createdAt: -1 });

    res.render("trip/approval", {
      title: "Approval Dinas Luar",
      trips,
      user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error load approval page");
  }
};
export const updateTrip = async (req, res) => {
  const user = req.session.user;
  const { id } = req.params;

  const trip = await BusinessTrip.findOne({
    _id: id,
    userId: user._id,
  });

  if (!trip) return res.status(404).send("Not found");

  if (trip.status !== "PENDING") {
    return res.status(403).send("Tidak bisa edit setelah masuk approval");
  }

  await BusinessTrip.findByIdAndUpdate(id, req.body);

  return res.redirect("/trip/my");
};
export const handleApproval = async (req, res) => {
  try {
    const user = req.session.user;
    const { id } = req.params;
    const { action, note } = req.body;
    // action = "APPROVE" | "REJECT"

    const trip = await BusinessTrip.findById(id);

    if (!trip) {
      return res.status(404).send("Data tidak ditemukan");
    }

    const role = user.role; // MANAGER | HR | PIMPINAN | etc

    // =========================
    // VALID STEP CHECK
    // =========================
    const currentStep = trip.currentStep;

    // HR acting as PIMPINAN (delegation)
    const isHRDelegatedAsPimpinan =
      role === "HR" && currentStep === "PIMPINAN" && trip.delegation?.active === true;

    const isPimpinan = role === "PIMPINAN";

    const isManager = role === "MANAGER";

    // =========================
    // AUTHORIZATION RULE
    // =========================
    if (currentStep === "MANAGER" && !isManager) {
      return res.status(403).send("Hanya Manager yang bisa approve step ini");
    }

    if (currentStep === "PIMPINAN" && !isPimpinan && !isHRDelegatedAsPimpinan) {
      return res.status(403).send("Tidak berhak approve step Pimpinan");
    }

    // =========================
    // REJECT RULE
    // =========================
    if (action === "REJECT") {
      if (!note || note.length < 5) {
        return res.status(400).send("Alasan reject wajib diisi");
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

      await trip.save();

      return res.json({ message: "Rejected successfully" });
    }

    // =========================
    // APPROVE RULE
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
      // STATE TRANSITION
      // =========================

      if (currentStep === "MANAGER") {
        trip.currentStep = "PIMPINAN";
        trip.status = "IN_REVIEW";
      } else if (currentStep === "PIMPINAN") {
        trip.currentStep = null;
        trip.status = "APPROVED";
      }

      await trip.save();

      return res.json({ message: "Approved successfully" });
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

export const allTrips = async (req, res) => {
  const trips = await BusinessTrip.find().populate("userId").sort({ createdAt: -1 });

  res.render("trip/all", {
    title: "Monitoring Dinas Luar",
    trips,
    user: req.session.user,
  });
};
