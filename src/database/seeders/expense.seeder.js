import ExpenseClaim from "../../models/ExpenseClaim.model.js";
import User from "../../models/basic/User.model.js";
import Employee from "../../models/employee/Employee.model.js";
import ExpenseCategory from "../../models/ExpenseCategory.model.js";

const usernames = [
  "basoherman",
  "ongkidwi",
  "sarwanto",
  "duwihartati",
  "ronaldrizky",
  "fadhilah",
  "fajarjaniko",
  "meltisundari",
  "rafikafitrianti",
];

const finalStatuses = ["PENDING_MANAGER", "PENDING_FINANCE", "PAID", "REJECTED"];

const realisticTitles = {
  transport: [
    "Bensin & Tol Kunjungan Klien",
    "Ganti Rugi Parkir & Tiket Tol",
    "GrabCar Menemui Vendor Luar",
    "Tiket Kereta Dinas Luar Kota",
    "Sewa Mobil Operasional Lapangan",
  ],
  konsumsi: [
    "Makan Siang Meeting Team",
    "Snack & Kopi Jamuan Tamu",
    "Konsumsi Rapat Evaluasi Bulanan",
    "Makan Malam Lembur Kerja",
    "Pembelian Air Galon Kantor",
  ],
  ATK: [
    "Pembelian Kertas A4 & Pulpen",
    "Tinta Printer & Logistik Arsip",
    "Kebutuhan Stopmap & Amplop Kantor",
    "Penjilidan Dokumen Proposal",
    "Buku Catatan & Lakban Packing",
  ],
  medis: [
    "Klaim Obat Resep Dokter Klinik",
    "Reimbursement Vitamin Karyawan",
    "Check-up Kesehatan Rutin",
    "Pembelian Kotak P3K Kantor",
    "Penggantian Biaya Kacamata Kerja",
  ],
  internet: [
    "Paket Data Tethering Lapangan",
    "Langganan Wi-Fi Router Backup",
    "Pulsa Komunikasi Koordinasi Lapangan",
    "Token Listrik Gudang Operasional",
    "Ganti Pulsa Nelpon Klien Luar",
  ],
  default: [
    "Biaya Operasional Tak Terduga",
    "Perbaikan Fasilitas Ruang Kerja",
    "Biaya Cetak Banner & Brosur",
    "Penggantian Pembelian Perlengkapan Kebersihan",
    "Dana Darurat Keperluan Kantor",
  ],
};

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate() {
  const start = new Date(2026, 0, 1);
  const end = new Date(2026, 4, 30);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateRealisticTitle(categoryName) {
  const nameLower = categoryName.toLowerCase();

  if (
    nameLower.includes("trans") ||
    nameLower.includes("perjalanan") ||
    nameLower.includes("bensin")
  ) {
    return randomItem(realisticTitles.transport);
  } else if (
    nameLower.includes("makan") ||
    nameLower.includes("konsumsi") ||
    nameLower.includes("kuliner")
  ) {
    return randomItem(realisticTitles.konsumsi);
  } else if (
    nameLower.includes("atk") ||
    nameLower.includes("tulis") ||
    nameLower.includes("print")
  ) {
    return randomItem(realisticTitles.ATK);
  } else if (
    nameLower.includes("sehat") ||
    nameLower.includes("medis") ||
    nameLower.includes("obat")
  ) {
    return randomItem(realisticTitles.medis);
  } else if (
    nameLower.includes("pulsa") ||
    nameLower.includes("kuota") ||
    nameLower.includes("internet") ||
    nameLower.includes("komunikasi")
  ) {
    return randomItem(realisticTitles.internet);
  }

  return randomItem(realisticTitles.default);
}

const expenseSeeder = async () => {
  try {
    const dbCategories = await ExpenseCategory.find({});
    if (!dbCategories.length) {
      console.log("Tidak ada Expense Category ditemukan. Seeding expense dibatalkan.");
      return;
    }

    const users = await User.find({ username: { $in: usernames } });
    if (!users.length) {
      console.log("Tidak ada user ditemukan. Seeding expense dibatalkan.");
      return;
    }

    await ExpenseClaim.deleteMany({});

    const data = [];

    for (const user of users) {
      const employee = await Employee.findOne({ userId: user._id });

      if (!employee) {
        console.log(`User ${user.username} dilewati karena tidak memiliki profil Employee.`);
        continue;
      }

      for (let i = 0; i < 100; i++) {
        const amount = Math.floor(Math.random() * 500000) + 50000;
        const date = randomDate();
        const status = randomItem(finalStatuses);
        const pickedCategory = randomItem(dbCategories);

        const cleanTitle = generateRealisticTitle(pickedCategory.name);

        data.push({
          userId: user._id,
          employeeId: employee._id,
          title: cleanTitle,
          category: pickedCategory._id,
          amount: amount,
          expenseDate: date,
          status: status,
          selfDeclaration: amount < 100000,
          proofFile: amount >= 100000 ? "nota-kredit.png" : null,
          transferProofFile:
            status === "PAID" && Math.random() > 0.5 ? "file-1779435027076.jpeg" : null,
          paidAt: status === "PAID" ? date : null,
          financeApprovedBy: status === "PAID" ? user._id : null,
          createdAt: date,
          updatedAt: new Date(),
        });
      }
    }

    if (data.length === 0) {
      console.log(
        "Tidak ada data klaim yang siap dimasukkan (Semua user tidak memiliki data Employee)."
      );
      return;
    }

    await ExpenseClaim.insertMany(data, { ordered: false });
    console.log(`Berhasil melakukan seeding ${data.length} berkas Expense Claim ke database.`);
  } catch (error) {
    console.error("Terjadi kegagalan saat menjalankan seeder:", error);
  }
};

export default expenseSeeder;
