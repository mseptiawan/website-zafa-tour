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

    let { title, startDate, endDate, destination, description, budget } = req.body;

    // =========================
    // NORMALIZE INPUT
    // =========================
    title = title?.trim();
    destination = destination?.trim();
    description = description?.trim();
    budget = Number(budget);

    // =========================
    // VALIDATION RULES
    // =========================

    // 1. TITLE
    if (!title || title.length < 5 || title.length > 100) {
      return res.status(400).send("Judul harus 5-100 karakter");
    }

    // 2. DATE CHECK
    if (!startDate || !endDate) {
      return res.status(400).send("Tanggal wajib diisi");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).send("Format tanggal tidak valid");
    }

    if (start > end) {
      return res.status(400).send("Tanggal mulai tidak boleh lebih besar dari tanggal selesai");
    }

    // optional: tidak boleh masa lalu
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).send("Tanggal tidak boleh di masa lalu");
    }

    // 3. DESTINATION
    if (!destination || destination.length < 3 || destination.length > 150) {
      return res.status(400).send("Tujuan harus 3-150 karakter");
    }

    // 4. DESCRIPTION
    if (!description || description.length < 10 || description.length > 1000) {
      return res.status(400).send("Deskripsi minimal 10 karakter");
    }

    // 5. BUDGET
    if (isNaN(budget) || budget < 0) {
      return res.status(400).send("Budget tidak valid");
    }

    const MAX_BUDGET = 50000000;
    if (budget > MAX_BUDGET) {
      return res.status(400).send("Budget melebihi batas 50 juta");
    }

    // =========================
    // SAVE TO DATABASE
    // =========================
    const trip = await BusinessTrip.create({
      userId: user._id,
      title,
      startDate: start,
      endDate: end,
      destination,
      description,
      budget,
      status: "PENDING",
    });

    return res.redirect("/trip/my");
  } catch (err) {
    console.error("CREATE_TRIP_ERROR:", err);
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
