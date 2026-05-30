import Bidang from "../models/basic/Bidang.js";
import Unit from "../models/basic/Unit.js";
import Position from "../models/basic/Position.js";
import AppError from "../utils/AppError.js";

// === WORKSPACE ===
export const fetchWorkspaceData = async () => {
  const listBidang = await Bidang.find().sort({ createdAt: -1 });
  const listUnit = await Unit.find().populate("bidangId").sort({ createdAt: -1 });
  const listPosition = await Position.find().sort({ createdAt: -1 });

  return { listBidang, listUnit, listPosition };
};

// === BIDANG SERVICES ===
export const addBidang = async (data) => {
  const existing = await Bidang.findOne({ name: data.name });
  if (existing) {
    throw new AppError("Nama bidang sudah digunakan", 400);
  }
  return await Bidang.create(data);
};

export const editBidang = async (id, data) => {
  const updated = await Bidang.findByIdAndUpdate(id, data, { new: true });
  if (!updated) {
    throw new AppError("Bidang tidak ditemukan", 404);
  }
  return updated;
};

export const removeBidang = async (id) => {
  const isUsed = await Unit.findOne({ bidangId: id });
  if (isUsed) {
    throw new AppError("Gagal! Bidang masih digunakan oleh Sub-Unit.", 400);
  }
  const deleted = await Bidang.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError("Bidang tidak ditemukan", 404);
  }
  return deleted;
};

// === UNIT SERVICES ===
export const addUnit = async (data) => {
  const newUnit = await Unit.create(data);
  return await Unit.findById(newUnit._id).populate("bidangId");
};

export const editUnit = async (id, data) => {
  const updated = await Unit.findByIdAndUpdate(id, data, { new: true });
  if (!updated) {
    throw new AppError("Sub-Unit tidak ditemukan", 404);
  }
  return updated;
};

export const removeUnit = async (id) => {
  const deleted = await Unit.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError("Sub-Unit tidak ditemukan", 404);
  }
  return deleted;
};

// === POSITION SERVICES ===
export const addPosition = async (data) => {
  const existing = await Position.findOne({ name: data.name });
  if (existing) {
    throw new AppError("Nama jabatan sudah digunakan", 400);
  }
  return await Position.create(data);
};

export const editPosition = async (id, data) => {
  const updated = await Position.findByIdAndUpdate(id, data, { new: true });
  if (!updated) {
    throw new AppError("Jabatan tidak ditemukan", 404);
  }
  return updated;
};

export const removePosition = async (id) => {
  const deleted = await Position.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError("Jabatan tidak ditemukan", 404);
  }
  return deleted;
};
