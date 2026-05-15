import SalesVisit from "../models/SalesVisit.js";

export const visitForm = (req, res) => {
  res.render("sales/visit", {
    title: "Input Sales Visit",
    error: null,
    old: {},
  });
};

export const storeVisit = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user) {
      return res.status(401).send("Session tidak valid");
    }

    let { customerName, address, meetWith, result, note } = req.body;

    customerName = customerName?.trim();
    address = address?.trim();
    meetWith = meetWith?.trim();
    result = result?.trim();
    note = note?.trim();

    // VALIDATION
    if (!customerName) {
      return res.status(400).send("Nama toko / customer wajib diisi");
    }

    if (!address) {
      return res.status(400).send("Alamat wajib diisi");
    }

    if (!meetWith) {
      return res.status(400).send("Bertemu dengan wajib diisi");
    }

    if (customerName.length > 100) {
      return res.status(400).send("Nama customer maksimal 100 karakter");
    }

    if (address.length > 300) {
      return res.status(400).send("Alamat maksimal 300 karakter");
    }

    if (meetWith.length > 100) {
      return res.status(400).send("Field bertemu dengan maksimal 100 karakter");
    }

    if (result && result.length > 500) {
      return res.status(400).send("Hasil kunjungan maksimal 500 karakter");
    }

    if (note && note.length > 500) {
      return res.status(400).send("Catatan maksimal 500 karakter");
    }

    // FILE HANDLING (ONLY req.files)
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

    const files = req.files || [];

    const invalidFile = files.find((file) => !allowedMimeTypes.includes(file.mimetype));

    if (invalidFile) {
      return res.status(400).send("Format file tidak valid (JPG, PNG, WEBP, PDF)");
    }

    const attachments = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/files/${file.filename}`,
    }));

    // SAVE
    await SalesVisit.create({
      userId: user._id,

      customerName,
      address,
      result,
      note,

      attachments,

      visitTime: new Date(),
    });

    return res.redirect("/sales/report");
  } catch (err) {
    console.log("STORE SALES VISIT ERROR:", err);
    return res.status(500).send("Gagal menyimpan sales visit");
  }
};
export const myVisits = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const visits = await SalesVisit.find({ userId }).sort({
      createdAt: -1,
    });

    res.render("sales/my", {
      title: "Sales Visit Saya",
      visits,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error load data");
  }
};

export const visitDetail = async (req, res) => {
  try {
    const visit = await SalesVisit.findById(req.params.id).populate("userId");

    if (!visit) {
      return res.status(404).send("Data tidak ditemukan");
    }

    res.render("sales/detail", {
      title: "Detail Sales Visit",
      visit,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error detail");
  }
};
export const salesReport = async (req, res) => {
  try {
    const visits = await SalesVisit.find().populate("userId").sort({ createdAt: -1 });

    res.render("sales/report", {
      title: "Laporan Sales",
      visits: visits || [],
      user: req.session.user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error load sales report");
  }
};

export const salesHistory = async (req, res) => {
  try {
    const user = req.session.user;

    const visits = await SalesVisit.find({
      userId: new mongoose.Types.ObjectId(user._id),
    }).sort({ createdAt: -1 });

    res.render("sales/history", {
      title: "Riwayat Kunjungan",
      visits,
    });
  } catch (err) {
    console.log("SALES HISTORY ERROR:", err);
    res.status(500).send("Error load riwayat kunjungan");
  }
};
