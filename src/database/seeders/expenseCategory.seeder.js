import ExpenseCategory from "../../models/ExpenseCategory.model.js";

const expenseCategories = [
  {
    name: "Transportasi & Perjalanan Dinas",
    description: "Biaya bensin, tol, parkir, tiket pesawat, ojek online, atau akomodasi luar kota.",
    isActive: true,
  },
  {
    name: "Konsumsi & Entertainment Client",
    description: "Biaya makan siang meeting, menjamu klien (entertainment), atau konsumsi lembur.",
    isActive: true,
  },
  {
    name: "Operasional & ATK",
    description:
      "Pembelian alat tulis kantor, printer supply, software pendukung, atau kebutuhan fisik kantor.",
    isActive: true,
  },
  {
    name: "Medis & Kesehatan",
    description:
      "Klaim biaya pengobatan rawat jalan, kacamata, atau vitamin sesuai plafon perusahaan.",
    isActive: true,
  },
  {
    name: "Komunikasi & Internet",
    description: "Biaya pulsa, kuota data internet, atau langganan tool komunikasi tim.",
    isActive: true,
  },
  {
    name: "Pelatihan & Sertifikasi",
    description: "Biaya pendaftaran kursus, seminar, webinar, atau sertifikasi keahlian karyawan.",
    isActive: true,
  },
];

const expenseCategorySeeder = async () => {
  try {
    await ExpenseCategory.deleteMany({});

    try {
      await ExpenseCategory.collection.dropIndex("code_1");
    } catch (indexError) {}

    await ExpenseCategory.insertMany(expenseCategories);
    console.log("Expense Category seeded successfully");
  } catch (error) {
    console.error("Error seeding Expense Category:", error);
  }
};

export default expenseCategorySeeder;
