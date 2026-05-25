import Bidang from "../models/basic/Bidang.js"; // sesuaikan path model Anda
import Unit from "../models/basic/Unit.js"; // sesuaikan path model Anda
import Position from "../models/basic/Position.js"; // sesuaikan path model Anda

// 1. Render Halaman Utama Struktur Organisasi
export const getWorkspace = async (req, res) => {
  try {
    const listBidang = await Bidang.find().sort({ createdAt: -1 });
    // Populate bidangId untuk mendapatkan nama bidang induk di tabel unit
    const listUnit = await Unit.find().populate("bidangId").sort({ createdAt: -1 });
    const listPosition = await Position.find().sort({ createdAt: -1 });

    res.render("organization/index", {
      title: "Konfigurasi Struktur Perusahaan",
      user: req.session.user, // parsing session user seperti login controller Anda
      listBidang,
      listUnit,
      listPosition,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// ================== CRUD BIDANG ==================
export const createBidang = async (req, res) => {
  try {
    const { name } = req.body;
    const existing = await Bidang.findOne({ name });
    if (existing)
      return res.status(400).json({ success: false, message: "Nama bidang sudah digunakan" });

    const newBidang = await Bidang.create({ name });
    res.status(201).json({ success: true, data: newBidang });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateBidang = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    await Bidang.findByIdAndUpdate(id, { name });
    res.json({ success: true, message: "Bidang berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteBidang = async (req, res) => {
  try {
    const { id } = req.params;
    // Validasi pencegahan jika bidang masih digunakan di model Unit
    const isUsed = await Unit.findOne({ bidangId: id });
    if (isUsed) {
      return res
        .status(400)
        .json({ success: false, message: "Gagal! Bidang masih digunakan oleh Sub-Unit." });
    }
    await Bidang.findByIdAndDelete(id);
    res.json({ success: true, message: "Bidang berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================== CRUD UNIT ==================
export const createUnit = async (req, res) => {
  try {
    const { bidangId, name, description } = req.body;
    const newUnit = await Unit.create({ bidangId, name, description });
    // Ambil data baru beserta populate bidang untuk dikembalikan ke client-side table
    const populatedUnit = await Unit.findById(newUnit._id).populate("bidangId");
    res.status(201).json({ success: true, data: populatedUnit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    await Unit.findByIdAndUpdate(id, { name, description });
    res.json({ success: true, message: "Sub-Unit berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;
    await Unit.findByIdAndDelete(id);
    res.json({ success: true, message: "Sub-Unit berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================== CRUD POSITION (JABATAN) ==================
export const createPosition = async (req, res) => {
  try {
    const { name, description } = req.body;
    const existing = await Position.findOne({ name });
    if (existing)
      return res.status(400).json({ success: false, message: "Nama jabatan sudah digunakan" });

    const newPost = await Position.create({ name, description });
    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body; // description di form dikirim sebagai 'keterangan'
    await Position.findByIdAndUpdate(id, { name, description });
    res.json({ success: true, message: "Jabatan berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deletePosition = async (req, res) => {
  try {
    const { id } = req.params;
    await Position.findByIdAndDelete(id);
    res.json({ success: true, message: "Jabatan berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
