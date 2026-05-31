import ExpenseCategory from "../models/ExpenseCategory.model.js";

// 1. Render Halaman Utama Admin (View EJS)
export const renderCategoryPage = async (req, res) => {
  try {
    const categories = await ExpenseCategory.find().sort({ name: 1 });
    res.render("expense/expense-category/index", {
      title: "Kelola Kategori Pengeluaran",
      categories,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading expense categories page");
  }
};

// 2. API: Tambah Kategori Baru
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existing = await ExpenseCategory.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Kategori sudah terdaftar" });
    }

    await ExpenseCategory.create({ name: name.trim(), description });
    return res.json({ success: true, message: "Kategori berhasil ditambahkan" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. API: Update Kategori
export const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    await ExpenseCategory.findByIdAndUpdate(req.params.id, {
      name: name.trim(),
      description,
    });
    return res.json({ success: true, message: "Kategori berhasil diperbarui" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 4. API: Toggle Status Aktif / Non-Aktif (Soft Delete)
export const toggleCategoryStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    await ExpenseCategory.findByIdAndUpdate(req.params.id, { isActive });
    return res.json({
      success: true,
      message: `Kategori berhasil di-${isActive ? "aktifkan" : "nonaktifkan"}`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
