import mongoose from "mongoose";
import User from "../../models/basic/User.model.js";
import Employee from "../../models/employee/Employee.model.js";
import Loan from "../../models/loan/Loan.model.js";
import LoanApproval from "../../models/loan/LoanApproval.model.js";
import LoanPayment from "../../models/loan/loanPayment.model.js";

const seedLoansCustom = async () => {
  try {
    const targetUsernames = [
      "fajarjaniko",
      "adindarismayani",
      "abdulaziz",
      "meltisundari",
      "basoherman",
    ];

    // 1. Cari User berdasarkan Username target
    const users = await User.find({
      username: { $in: targetUsernames.map((name) => new RegExp(name, "i")) },
    });

    if (!users.length) {
      console.log("❌ Tidak ada user target yang ditemukan untuk seeding loan.");
      return;
    }

    // 2. Ambil ID Employee terkait
    const employees = await Employee.find({ userId: { $in: users.map((u) => u._id) } });
    if (!employees.length) {
      console.log("❌ Data Employee tidak ditemukan untuk user tersebut.");
      return;
    }

    console.log(`🧹 Membersihkan data Loan lama khusus untuk 5 pegawai target...`);
    const employeeIds = employees.map((e) => e._id);
    await Loan.deleteMany({ employeeId: { $in: employeeIds } });
    await LoanApproval.deleteMany({
      loanId: { $in: await Loan.find({ employeeId: { $in: employeeIds } }).distinct("_id") },
    });
    await LoanPayment.deleteMany({ employeeId: { $in: employeeIds } });

    const loanRecords = [];
    const approvalRecords = [];
    const paymentRecords = [];

    // Definisikan waktu pencairan simulasi
    const cairBulanMei = new Date(Date.UTC(2026, 4, 15)); // 15 Mei 2026
    const cairBulanJuni = new Date(Date.UTC(2026, 5, 10)); // 10 Juni 2026

    for (const emp of employees) {
      const userObj = users.find((u) => u._id.toString() === emp.userId.toString());
      const username = userObj ? userObj.username.toLowerCase() : "";

      // =========================================================================
      // SKENARIO 1: SEMUA PEGAWAI MENCAIRKAN PINJAMAN DI BULAN MEI
      // =========================================================================
      const loanMeiId = new mongoose.Types.ObjectId();
      const amountMei = 3000000; // Total pinjaman 3 Juta
      const tenorMei = 3; // Tenor 3 bulan
      const cicilanMei = 1000000; // 1 Juta per bulan

      loanRecords.push({
        _id: loanMeiId,
        employeeId: emp._id,
        amountRequested: amountMei,
        tenorMonths: tenorMei,
        monthlyDeduction: cicilanMei,
        reason: "Pinjaman keperluan mendesak keluarga (Seeder Mei)",
        status: "APPROVED",
        disbursementDate: cairBulanMei,
        paymentProof: "/uploads/files/bukti_transfer_mei.pdf",
      });

      // Generate history approval lengkap untuk Manager Keuangan (Disbursed)
      approvalRecords.push({
        loanId: loanMeiId,
        step: "MANAGER_KEUANGAN",
        status: "APPROVED",
        note: "Dana seeder Mei telah ditransfer.",
        actionDate: cairBulanMei,
      });

      // Jadwal Angsuran Pinjaman Mei (Cair Mei, tagihan dimulai Juni, Juli, Agustus)
      for (let i = 1; i <= tenorMei; i++) {
        const nextDate = new Date(cairBulanMei.getFullYear(), cairBulanMei.getMonth() + i, 1);
        const periodMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;

        paymentRecords.push({
          loanId: loanMeiId,
          employeeId: emp._id,
          installmentNumber: i,
          amount: cicilanMei,
          periodMonth: periodMonth, // i=1 -> 2026-06, i=2 -> 2026-07, dst.
          isPaid: false,
        });
      }

      // =========================================================================
      // SKENARIO 2: KHUSUS ADINDARISMAYANI ADA PINJAMAN KEDUA DI BULAN JUNI
      // =========================================================================
      if (username.includes("adindarismayani")) {
        const loanJuniId = new mongoose.Types.ObjectId();
        const amountJuni = 1500000; // Pinjaman kedua 1.5 Juta
        const tenorJuni = 3; // Tenor 3 bulan
        const cicilanJuni = 500000; // 500 Ribu per bulan

        loanRecords.push({
          _id: loanJuniId,
          employeeId: emp._id,
          amountRequested: amountJuni,
          tenorMonths: tenorJuni,
          monthlyDeduction: cicilanJuni,
          reason: "Biaya tambahan perbaikan rumah (Seeder Juni)",
          status: "APPROVED",
          disbursementDate: cairBulanJuni,
          paymentProof: "/uploads/files/bukti_transfer_juni.pdf",
        });

        approvalRecords.push({
          loanId: loanJuniId,
          step: "MANAGER_KEUANGAN",
          status: "APPROVED",
          note: "Dana seeder Juni telah ditransfer.",
          actionDate: cairBulanJuni,
        });

        // Jadwal Angsuran Pinjaman Juni (Cair Juni, tagihan dimulai Juli, Agustus, September)
        // KARENA REQUEST: 2 cicilan bayar di Juni, kita paksa angsuran ke-1 pinjaman ini jatuh di 2026-06
        for (let i = 1; i <= tenorJuni; i++) {
          // Normalnya i = bulan berjalan + i. Kita ubah agar index 1 langsung kena di bulan Juni (month + i - 1)
          const nextDate = new Date(
            cairBulanJuni.getFullYear(),
            cairBulanJuni.getMonth() + i - 1,
            1
          );
          const periodMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;

          paymentRecords.push({
            loanId: loanJuniId,
            employeeId: emp._id,
            installmentNumber: i,
            amount: cicilanJuni,
            periodMonth: periodMonth, // i=1 -> 2026-06, i=2 -> 2026-07
            isPaid: false,
          });
        }
      }
    }

    // 3. Insert massal ke MongoDB
    await Loan.insertMany(loanRecords);
    await LoanApproval.insertMany(approvalRecords);
    await LoanPayment.insertMany(paymentRecords);

    console.log(`\n================================================================`);
    console.log(`🚀 [SUCCESS] Seeding data pinjaman kustom berhasil dijalankan!`);
    console.log(`📝 Total Master Pinjaman : ${loanRecords.length} Data`);
    console.log(`💳 Total Jadwal Angsuran  : ${paymentRecords.length} Baris Tagihan`);
    console.log(`🎯 Adinda Rismayani sukses memiliki 2 cicilan aktif di periode 2026-06.`);
    console.log(`================================================================\n`);
  } catch (error) {
    console.error("❌ Gagal menyuntikkan data seeder pinjaman:", error);
  }
};

export default seedLoansCustom;
