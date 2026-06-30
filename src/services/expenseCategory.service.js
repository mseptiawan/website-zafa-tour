import ExpenseCategory from "../models/ExpenseCategory.model.js";

/**
 * Mengambil seluruh daftar kategori pengeluaran diurutkan berdasarkan nama secara ascending.
 * @returns {Promise<Array<Object>>} Daftar kategori murni (POJO) via .lean()
 */
export const findAllCategories = async () => {
  return await ExpenseCategory.find().sort({ name: 1 }).lean();
};

/**
 * Memeriksa apakah nama kategori sudah terdaftar di sistem (case-insensitive & trim).
 * @param {string} name - Nama kategori yang ingin dicek
 * @returns {Promise<boolean>} True jika duplikat, False jika aman
 */
export const checkDuplicateName = async (name) => {
  if (!name) return false;
  const existing = await ExpenseCategory.findOne({
    name: { $regex: `^${name.trim()}$`, $options: "i" },
  }).lean();

  return !!existing;
};

/**
 * Membuat data kategori pengeluaran baru ke dalam database.
 * @param {Object} payload - Data kategori baru
 * @param {string} payload.name - Nama kategori
 * @param {string} [payload.description] - Deskripsi kategori
 * @returns {Promise<Object>} Instance dokumen Mongoose yang berhasil dibuat
 */
export const createCategory = async ({ name, description }) => {
  return await ExpenseCategory.create({
    name: name.trim(),
    description,
  });
};

/**
 * Memperbarui data nama dan deskripsi kategori berdasarkan ID.
 * @param {string} id - ID kategori dokumen
 * @param {Object} payload - Data pembaruan
 * @param {string} payload.name - Nama kategori baru
 * @param {string} [payload.description] - Deskripsi kategori baru
 * @returns {Promise<Object|null>} Dokumen ter-update murni
 */
export const updateCategory = async (id, { name, description }) => {
  return await ExpenseCategory.findByIdAndUpdate(
    id,
    { name: name.trim(), description },
    { new: true }
  ).lean();
};

/**
 * Mengubah status aktif / nonaktif (Soft Delete) dari suatu kategori.
 * @param {string} id - ID kategori dokumen
 * @param {boolean} isActive - Status aktif baru (true/false)
 * @returns {Promise<Object|null>} Dokumen ter-update murni
 */
export const updateCategoryStatus = async (id, isActive) => {
  return await ExpenseCategory.findByIdAndUpdate(id, { isActive }, { new: true }).lean();
};
