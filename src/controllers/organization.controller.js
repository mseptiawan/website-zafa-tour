import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import {
  fetchWorkspaceData,
  addBidang,
  editBidang,
  removeBidang,
  addUnit,
  editUnit,
  removeUnit,
  addPosition,
  editPosition,
  removePosition,
} from "../services/organization.service.js";

// ─── WORKSPACE VIEW ──────────────────────────────────────────────────────────
export const getWorkspace = asyncHandler(async (req, res) => {
  const data = await fetchWorkspaceData();

  res.render("organization/index", {
    ...buildRenderData(req, {
      title: "Konfigurasi Struktur Perusahaan",
      ...data,
    }),
  });
});

// ─── BIDANG CONTROLLERS (AJAX API) ───────────────────────────────────────────
export const createBidang = asyncHandler(async (req, res) => {
  if (req.validationErrors) {
    return res.status(400).json({ success: false, errors: req.validationErrors });
  }
  const newBidang = await addBidang(req.body);
  res.status(201).json({ success: true, data: newBidang });
});

export const updateBidang = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await editBidang(id, req.body);
  res.json({ success: true, message: "Bidang berhasil diperbarui" });
});

export const deleteBidang = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await removeBidang(id);
  res.json({ success: true, message: "Bidang berhasil dihapus" });
});

// ─── UNIT CONTROLLERS (AJAX API) ─────────────────────────────────────────────
export const createUnit = asyncHandler(async (req, res) => {
  if (req.validationErrors) {
    return res.status(400).json({ success: false, errors: req.validationErrors });
  }
  const populatedUnit = await addUnit(req.body);
  res.status(201).json({ success: true, data: populatedUnit });
});

export const updateUnit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await editUnit(id, req.body);
  res.json({ success: true, message: "Sub-Unit berhasil diperbarui" });
});

export const deleteUnit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await removeUnit(id);
  res.json({ success: true, message: "Sub-Unit berhasil dihapus" });
});

// ─── POSITION CONTROLLERS (AJAX API) ─────────────────────────────────────────
export const createPosition = asyncHandler(async (req, res) => {
  if (req.validationErrors) {
    return res.status(400).json({ success: false, errors: req.validationErrors });
  }
  const newPost = await addPosition(req.body);
  res.status(201).json({ success: true, data: newPost });
});

export const updatePosition = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await editPosition(id, req.body);
  res.json({ success: true, message: "Jabatan berhasil diperbarui" });
});

export const deletePosition = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await removePosition(id);
  res.json({ success: true, message: "Jabatan berhasil dihapus" });
});
