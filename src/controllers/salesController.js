import SalesVisit from "../models/SalesVisit.js";

/*
|--------------------------------------------------------------------------
| HALAMAN FORM SALES VISIT
|--------------------------------------------------------------------------
*/
export const visitForm = (req, res) => {
  res.render("sales/visit", {
    title: "Input Sales Visit",
  });
};

/*
|--------------------------------------------------------------------------
| SIMPAN KUNJUNGAN SALES
|--------------------------------------------------------------------------
*/
export const storeVisit = async (req, res) => {
  try {
    const user = req.session.user;

    // =========================
    // SESSION VALIDATION
    // =========================
    if (!user) {
      return res.status(401).send("Session tidak valid");
    }

    // =========================
    // BODY
    // =========================
    let { customerName, address, meetWith, result, note } = req.body;

    // =========================
    // TRIM
    // =========================
    customerName = customerName?.trim();
    address = address?.trim();
    meetWith = meetWith?.trim();
    result = result?.trim();
    note = note?.trim();

    // =========================
    // REQUIRED VALIDATION
    // =========================
    if (!customerName) {
      return res.status(400).send("Nama toko / customer wajib diisi");
    }

    if (!address) {
      return res.status(400).send("Alamat wajib diisi");
    }

    if (!meetWith) {
      return res.status(400).send("Bertemu dengan wajib diisi");
    }

    // =========================
    // LENGTH VALIDATION
    // =========================
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

    // =========================
    // PHOTO VALIDATION
    // =========================
    let photos = [];

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    // SINGLE FILE
    if (req.file) {
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).send("Format foto harus JPG, PNG, atau WEBP");
      }

      photos.push(`/uploads/${req.file.filename}`);
    }

    // MULTIPLE FILE
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return res.status(400).send("Format foto harus JPG, PNG, atau WEBP");
        }
      }

      photos = req.files.map((file) => `/uploads/${file.filename}`);
    }

    // =========================
    // SAVE
    // =========================
    await SalesVisit.create({
      userId: new mongoose.Types.ObjectId(user._id),

      customerName,
      address,
      meetWith,
      result,
      note,

      photos,

      visitTime: new Date(),
    });

    // =========================
    // REDIRECT
    // =========================
    return res.redirect("/sales/report");
  } catch (err) {
    console.log("STORE SALES VISIT ERROR:", err);

    return res.status(500).send("Gagal menyimpan sales visit");
  }
};
/*
|--------------------------------------------------------------------------
| LIST SALES VISIT USER
|--------------------------------------------------------------------------
*/
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

/*
|--------------------------------------------------------------------------
| DETAIL SALES VISIT
|--------------------------------------------------------------------------
*/
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
      visits: visits || [], // 🔥 PENTING
      user: req.session.user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error load sales report");
  }
};
import mongoose from "mongoose";

export const salesHistory = async (req, res) => {
  try {
    const user = req.session.user;

    const visits = await SalesVisit.find({
      userId: new mongoose.Types.ObjectId(user._id), // ← convert String ke ObjectId
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
