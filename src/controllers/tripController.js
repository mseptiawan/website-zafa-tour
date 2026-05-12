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

    let {
      title,
      startDate,
      endDate,
      destination,
      description,
      budget,
      contactName,
      contactPhone,
      timeline, // 👈 ARRAY INPUT
    } = req.body;

    // =========================
    // NORMALIZE
    // =========================
    title = title?.trim();
    destination = destination?.trim();
    description = description?.trim();
    budget = Number(budget);

    // timeline bisa string atau array dari form
    if (!Array.isArray(timeline)) {
      timeline = timeline ? [timeline] : [];
    }

    timeline = timeline
      .map((t, index) => ({
        address: t?.trim(),
        order: index + 1,
      }))
      .filter((t) => t.address);

    // =========================
    // VALIDATION
    // =========================

    if (!title || title.length < 5 || title.length > 100) {
      return res.status(400).send("Judul minimal 5 karakter");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).send("Tanggal tidak valid");
    }

    if (!destination || destination.length < 3) {
      return res.status(400).send("Tujuan tidak valid");
    }

    if (!description || description.length < 10) {
      return res.status(400).send("Deskripsi terlalu pendek");
    }

    if (isNaN(budget) || budget < 0) {
      return res.status(400).send("Budget tidak valid");
    }

    if (timeline.length === 0) {
      return res.status(400).send("Timeline wajib diisi minimal 1 lokasi");
    }

    // =========================
    // SAVE
    // =========================
    const trip = await BusinessTrip.create({
      userId: user._id,
      title,
      startDate: start,
      endDate: end,
      destination,
      description,
      budget,

      contactPerson: {
        name: contactName,
        phone: contactPhone,
      },

      timeline,

      status: "PENDING",
    });

    return res.redirect("/trip/my");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Gagal membuat pengajuan");
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

export const tripDetail = async (req, res) => {
  try {
    const trip = await BusinessTrip.findById(req.params.id).populate("userId");

    if (!trip) {
      return res.status(404).send("Data tidak ditemukan");
    }

    res.render("trip/detail", {
      title: "Detail Dinas Luar",
      trip,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error detail");
  }
};

export const approveManagerTrip = async (req, res) => {
  try {
    await BusinessTrip.findByIdAndUpdate(req.params.id, {
      status: "APPROVED_MANAGER",
      "approvedByManager.userId": req.session.user._id,
      "approvedByManager.date": new Date(),
    });

    return res.redirect("/trip/all");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error approval manager");
  }
};

export const approveDirector = async (req, res) => {
  try {
    await BusinessTrip.findByIdAndUpdate(req.params.id, {
      status: "APPROVED_DIRECTOR",
      "approvedByDirector.userId": req.session.user._id,
      "approvedByDirector.date": new Date(),
    });

    return res.redirect("/trip/all");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error approval director");
  }
};
