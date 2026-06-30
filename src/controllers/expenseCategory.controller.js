import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import {
  findAllCategories,
  checkDuplicateName,
  createCategory,
  updateCategory,
  updateCategoryStatus,
} from "../services/expenseCategory.service.js";

/**
 * ─── METHOD 1: RENDER INDEX PAGE ─────────────────────────────────────────────
 */
export const index = asyncHandler(async (req, res) => {
  const categories = await findAllCategories();

  res.render("expense/expense-category/index", {
    ...buildRenderData(req, {
      title: "Kelola Kategori Pengeluaran",
      categories,
    }),
  });
});

/**
 * ─── METHOD 2: STORE NEW CATEGORY (API) ──────────────────────────────────────
 */
export const store = asyncHandler(async (req, res) => {
  if (req.validationErrors) {
    const categories = await findAllCategories();
    return res.status(400).render("expense/expense-category/index", {
      ...buildRenderData(req, {
        title: "Kelola Kategori Pengeluaran",
        categories,
        errors: req.validationErrors,
        old: req.body,
        error: ["Mohon periksa kembali form pengisian Anda."],
      }),
    });
  }

  const { name, description } = req.body;

  const isDuplicate = await checkDuplicateName(name);
  if (isDuplicate) {
    return res.status(400).json({
      success: false,
      message: "Kategori sudah terdaftar",
    });
  }

  await createCategory({ name, description });

  req.flash("success", "Kategori pengeluaran berhasil ditambahkan!");
  return res.json({
    success: true,
    message: "Kategori berhasil ditambahkan",
  });
});

/**
 * ─── METHOD 3: UPDATE CATEGORY (API) ─────────────────────────────────────────
 */
export const update = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { id } = req.params;

  await updateCategory(id, { name, description });

  req.flash("success", "Kategori pengeluaran berhasil diperbarui!");
  return res.json({
    success: true,
    message: "Kategori berhasil diperbarui",
  });
});

/**
 * ─── METHOD 4: TOGGLE STATUS (API) ───────────────────────────────────────────
 */
export const toggleStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  await updateCategoryStatus(id, isActive);

  const statusText = isActive ? "diaktifkan" : "dinonaktifkan";
  req.flash("success", `Kategori berhasil di-${statusText}!`);

  return res.json({
    success: true,
    message: `Kategori berhasil di-${statusText}`,
  });
});
