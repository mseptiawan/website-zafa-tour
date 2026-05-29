import * as orgService from "../services/organization.service.js";
import { validateData } from "../utils/validateData.js";
import { bidangSchema, unitSchema, positionSchema } from "../validations/organization.schema.js";

// === WORKSPACE ===
export const getWorkspace = async (req, res, next) => {
  try {
    const data = await orgService.fetchWorkspaceData();
    res.render("organization/index", {
      title: "Konfigurasi Struktur Perusahaan",
      user: req.session.user,
      ...data,
    });
  } catch (err) {
    next(err);
  }
};

// === BIDANG CONTROLLERS ===
export const createBidang = async (req, res, next) => {
  try {
    const validatedBody = validateData(bidangSchema, req.body);
    const newBidang = await orgService.addBidang(validatedBody);
    res.status(201).json({ success: true, data: newBidang });
  } catch (err) {
    next(err);
  }
};

export const updateBidang = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedBody = validateData(bidangSchema, req.body);
    await orgService.editBidang(id, validatedBody);
    res.json({ success: true, message: "Bidang berhasil diperbarui" });
  } catch (err) {
    next(err);
  }
};

export const deleteBidang = async (req, res, next) => {
  try {
    const { id } = req.params;
    await orgService.removeBidang(id);
    res.json({ success: true, message: "Bidang berhasil dihapus" });
  } catch (err) {
    next(err);
  }
};

// === UNIT CONTROLLERS ===
export const createUnit = async (req, res, next) => {
  try {
    const validatedBody = validateData(unitSchema, req.body);
    const populatedUnit = await orgService.addUnit(validatedBody);
    res.status(201).json({ success: true, data: populatedUnit });
  } catch (err) {
    next(err);
  }
};

export const updateUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedBody = validateData(unitSchema, req.body);
    await orgService.editUnit(id, validatedBody);
    res.json({ success: true, message: "Sub-Unit berhasil diperbarui" });
  } catch (err) {
    next(err);
  }
};

export const deleteUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    await orgService.removeUnit(id);
    res.json({ success: true, message: "Sub-Unit berhasil dihapus" });
  } catch (err) {
    next(err);
  }
};

// === POSITION CONTROLLERS ===
export const createPosition = async (req, res, next) => {
  try {
    const validatedBody = validateData(positionSchema, req.body);
    const newPost = await orgService.addPosition(validatedBody);
    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    next(err);
  }
};

export const updatePosition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedBody = validateData(positionSchema, req.body);
    await orgService.editPosition(id, validatedBody);
    res.json({ success: true, message: "Jabatan berhasil diperbarui" });
  } catch (err) {
    next(err);
  }
};

export const deletePosition = async (req, res, next) => {
  try {
    const { id } = req.params;
    await orgService.removePosition(id);
    res.json({ success: true, message: "Jabatan berhasil dihapus" });
  } catch (err) {
    next(err);
  }
};
