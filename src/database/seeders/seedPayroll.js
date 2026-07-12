import mongoose from "mongoose";
import Payroll from "../../models/payroll/Payroll.model.js";
import Employee from "../../models/employee/Employee.model.js";

// Ambil URI dari environment variable, atau gunakan fallback local jika belum terdefinisi
const DB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/db_zafatour";

const seedPayroll = async () => {
  try {
    // 1. CEK KONEKSI: Hanya buka koneksi baru jika statusnya disconnected (0)
    if (mongoose.connection.readyState === 0) {
      console.log("Membuka koneksi database baru...");
      await mongoose.connect(DB_URI);
      console.log("Terhubung ke database.");
    } else {
      console.log("Menggunakan koneksi database yang sudah aktif.");
    }

    // 2. Hapus data lama agar tidak melanggar index unik (employeeId + periodMonth)
    await Payroll.deleteMany({});
    console.log("Data Payroll lama berhasil dibersihkan.");

    // 3. Ambil data semua karyawan yang ada di database
    const employees = await Employee.find({});
    if (employees.length === 0) {
      console.log(
        "⚠️ Error: Tidak ada data karyawan ditemukan. Harap jalankan seed Employee terlebih dahulu."
      );
      return;
    }

    // 4. Struktur data tiruan (mock data) untuk penggajian periode Juli 2026
    const payrollData = employees.map((emp) => {
      const basicSalary = 5000000; // Contoh Gaji Pokok Rp 5.000.000

      const allowances = [
        { componentName: "Tunjangan Jabatan", amount: 1000000 },
        { componentName: "Uang Makan", amount: 500000 },
      ];

      const deductions = [
        { componentName: "BPJS Kesehatan", amount: 100000 },
        { componentName: "PPH 21", amount: 50000 },
      ];

      const loanAmount = 0; // Set nominal jika karyawan memiliki pinjaman aktif

      // Hitung akumulasi secara otomatis menggunakan fungsi reduce
      const totalAllowance = allowances.reduce((sum, item) => sum + item.amount, 0);
      const totalDeduction = deductions.reduce((sum, item) => sum + item.amount, 0) + loanAmount;

      const totalEarnings = basicSalary + totalAllowance;
      const netTakeHomePay = totalEarnings - totalDeduction;

      return {
        employeeId: emp._id,
        periodMonth: "2026-07", // Sinkron dengan siklus dashboard berjalan
        basicSalary,
        allowances,
        deductions,
        loanDeduction: {
          loanPaymentId: null,
          amount: loanAmount,
        },
        totalEarnings,
        totalDeductions: totalDeduction,
        netTakeHomePay,
        status: "CLOSED", // Langsung CLOSED agar datanya terekam di analitik dan laporan keuangan
        mutationFile: null,
        paidAt: new Date(),
      };
    });

    // 5. Masukkan data payroll baru secara massal (bulk insert)
    await Payroll.insertMany(payrollData);
    console.log(`✅ Berhasil menyisipkan ${payrollData.length} data Payroll baru.`);
  } catch (error) {
    console.error("❌ Gagal melakukan seeding payroll:", error);
  }
};

export default seedPayroll;
