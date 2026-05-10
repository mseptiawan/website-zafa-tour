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

    const { title, startDate, endDate, destination, description, budget } =
      req.body;

    // 🔥 SIMPAN KE MONGODB
    const trip = await BusinessTrip.create({
      userId: user._id, // penting: per user login
      title,
      startDate,
      endDate,
      destination,
      description,
      budget,
      status: "PENDING", // default approval
    });

    return res.redirect("/trip/my");
  } catch (err) {
    console.log(err);
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
  const trips = await BusinessTrip.find()
    .populate("userId")
    .sort({ createdAt: -1 });

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
