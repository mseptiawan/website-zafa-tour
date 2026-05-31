import Permit from "../models/Permit.model.js";

// 1. Menampilkan Form Pengajuan Izin
export const newForm = async (req, res) => {
  try {
    res.render("permit/create", {
      title: "Pengajuan Izin",
      mode: "CREATE",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Memproses Data Form (POST)
export const createPermit = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: "Semua field wajib diisi" });
    }

    let documentPath = null;
    if (req.file) {
      documentPath = `/uploads/photos/${req.file.filename}`;
    }

    const newPermit = new Permit({
      user: req.user._id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      document: documentPath,
    });

    await newPermit.save();

    res.redirect("/permit/my");
  } catch (error) {
    console.error("Error creating permit:", error);
    res.status(500).json({ success: false, message: "Gagal memproses pengajuan izin" });
  }
};
