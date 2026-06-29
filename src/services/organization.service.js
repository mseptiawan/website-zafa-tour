import Bidang from "../models/basic/Bidang.model.js";
import Unit from "../models/basic/Unit.model.js";
import Position from "../models/basic/Position.model.js";
import AppError from "../utils/AppError.js";

/**
 * Mengambil seluruh log data master organisasi untuk keperluan initial view (Optimal via .lean()).
 * @returns {Promise<{listBidang: Array<Object>, listUnit: Array<Object>, listPosition: Array<Object>}>}
 */
export const fetchWorkspaceData = async () => {
  const listBidang = await Bidang.find().sort({ createdAt: -1 }).lean();
  const listUnit = await Unit.find().populate("bidangId").sort({ createdAt: -1 }).lean();
  const listPosition = await Position.find().sort({ createdAt: -1 }).lean();

  return { listBidang, listUnit, listPosition };
};

// ─── BIDANG SERVICES ─────────────────────────────────────────────────────────

/**
 * Mendaftarkan Bidang Induk Utama baru ke dalam sistem setelah pengecekan duplikasi nama.
 * @param {Object} data - Payload data bidang kerja
 * @returns {Promise<Object>} Data bidang murni yang berhasil terbuat
 */
export const addBidang = async (data) => {
  const existing = await Bidang.findOne({ name: data.name }).lean();
  if (existing) {
    throw new AppError("Nama bidang sudah digunakan", 400);
  }
  const newBidang = await Bidang.create(data);
  return newBidang.toObject();
};

/**
 * Memperbarui data detail Bidang Induk berdasarkan ID dokumen.
 * @param {string} id - Target Object ID dokumen MongoDB
 * @param {Object} data - Payload data pembaruan
 * @returns {Promise<Object>}
 */
export const editBidang = async (id, data) => {
  const updated = await Bidang.findByIdAndUpdate(id, data, { new: true }).lean();
  if (!updated) {
    throw new AppError("Bidang tidak ditemukan", 404);
  }
  return updated;
};

/**
 * Menghapus permanen dokumen Bidang Induk jika tidak terikat dengan Sub-Unit aktif manapun.
 * @param {string} id - Target Object ID dokumen MongoDB
 * @returns {Promise<Object>}
 */
export const removeBidang = async (id) => {
  const isUsed = await Unit.findOne({ bidangId: id }).lean();
  if (isUsed) {
    throw new AppError("Gagal! Bidang masih digunakan oleh Sub-Unit Kerja.", 400);
  }
  const deleted = await Bidang.findByIdAndDelete(id).lean();
  if (!deleted) {
    throw new AppError("Bidang tidak ditemukan", 404);
  }
  return deleted;
};

// ─── UNIT SERVICES ───────────────────────────────────────────────────────────

/**
 * Membuat Sub-Unit Kerja baru yang berelasi dengan Bidang Induk tertentu.
 * @param {Object} data - Payload unit kerja baru beserta bidangId pembungkusnya
 * @returns {Promise<Object>} Data unit terpopulasi dengan bidang murni
 */
export const addUnit = async (data) => {
  const newUnit = await Unit.create(data);
  return await Unit.findById(newUnit._id).populate("bidangId").lean();
};

/**
 * Memperbarui data informasi Sub-Unit Kerja.
 * @param {string} id - Target Object ID dokumen MongoDB
 * @param {Object} data - Payload data pembaruan
 * @returns {Promise<Object>}
 */
export const editUnit = async (id, data) => {
  const updated = await Unit.findByIdAndUpdate(id, data, { new: true }).lean();
  if (!updated) {
    throw new AppError("Sub-Unit tidak ditemukan", 404);
  }
  return updated;
};

/**
 * Menghapus permanen dokumen Sub-Unit Kerja.
 * @param {string} id - Target Object ID dokumen MongoDB
 * @returns {Promise<Object>}
 */
export const removeUnit = async (id) => {
  const deleted = await Unit.findByIdAndDelete(id).lean();
  if (!deleted) {
    throw new AppError("Sub-Unit tidak ditemukan", 404);
  }
  return deleted;
};

// ─── POSITION SERVICES ───────────────────────────────────────────────────────

/**
 * Mendaftarkan Level Tingkatan Jabatan / Jenjang Karier baru di perusahaan.
 * @param {Object} data - Payload struktur jabatan baru
 * @returns {Promise<Object>}
 */
export const addPosition = async (data) => {
  const existing = await Position.findOne({ name: data.name }).lean();
  if (existing) {
    throw new AppError("Nama jabatan sudah digunakan", 400);
  }
  const newPost = await Position.create(data);
  return newPost.toObject();
};

/**
 * Memperbarui data informasi Level Jabatan.
 * @param {string} id - Target Object ID dokumen MongoDB
 * @param {Object} data - Payload data pembaruan
 * @returns {Promise<Object>}
 */
export const editPosition = async (id, data) => {
  const updated = await Position.findByIdAndUpdate(id, data, { new: true }).lean();
  if (!updated) {
    throw new AppError("Jabatan tidak ditemukan", 404);
  }
  return updated;
};

/**
 * Menghapus permanen dokumen Tingkatan Level Jabatan dari sistem.
 * @param {string} id - Target Object ID dokumen MongoDB
 * @returns {Promise<Object>}
 */
export const removePosition = async (id) => {
  const deleted = await Position.findByIdAndDelete(id).lean();
  if (!deleted) {
    throw new AppError("Jabatan tidak ditemukan", 404);
  }
  return deleted;
};
