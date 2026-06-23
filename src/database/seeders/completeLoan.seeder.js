import mongoose from "mongoose";
import User from "../../models/basic/User.model.js";
import Role from "../../models/basic/Role.model.js";
import Bidang from "../../models/basic/Bidang.model.js";
import Employee from "../../models/employee/Employee.model.js";
import EmployeeSalary from "../../models/employee/EmployeeSalary.model.js";
import Loan from "../../models/loan/Loan.model.js";
import LoanApproval from "../../models/loan/LoanApproval.model.js";
import LoanPayment from "../../models/loan/loanPayment.model.js";

import EmployeeCareer from "../../models/employee/EmployeeCareer.js";
import Position from "../../models/basic/Position.model.js";

const completeLoanSeeder = async () => {
  try {
    await Loan.deleteMany({});
    await LoanApproval.deleteMany({});
    await LoanPayment.deleteMany({});

    console.log("Data transaksi pinjaman masa lalu berhasil dibersihkan.");

    // Tambahkan target username baru sesuai kebutuhanmu
    const targetKeys = [
      "fajarjaniko",
      "adindarismayani",
      "abdulaziz",
      "meltisundari",
      "basoherman",
    ];
    const regexFilters = targetKeys.map((key) => new RegExp(key, "i"));

    const userDocs = await User.find({ username: { $in: regexFilters } });

    const employeeDocs = await Employee.find({
      $or: [{ fullName: { $in: regexFilters } }, { userId: { $in: userDocs.map((u) => u._id) } }],
    }).populate({
      path: "careerData",
      populate: { path: "bidangId" },
    });

    if (employeeDocs.length === 0) {
      throw new Error(
        "Mongoose tidak menemukan data pegawai tersebut di database. Pastikan 'employeeSeeder' utama sudah dijalankan!"
      );
    }

    const empMap = {};
    employeeDocs.forEach((e) => {
      const keyNormalized = e.fullName.toLowerCase().replace(/\s/g, "");
      empMap[keyNormalized] = e;

      const associatedUser = userDocs.find((u) => u._id.toString() === e.userId.toString());
      if (associatedUser) {
        empMap[associatedUser.username.toLowerCase().replace(/\s/g, "")] = e;
      }
    });

    const anyUser = await User.findOne({ username: { $nin: regexFilters } });
    const approverId = anyUser ? anyUser._id : new mongoose.Types.ObjectId();

    console.log(`👥 Berhasil memetakan ${employeeDocs.length} profil target untuk simulasi.`);

    // =========================================================================
    // INJEKSI DATA TRANSAKSI PER PEGAWAI (STYLE KAMU)
    // =========================================================================

    // 1. FAJAR JANIKO (Aktif - Bulan Juni Bayar Cicilan Ke-2)
    const empFajar = empMap["fajarjaniko"];
    if (empFajar) {
      const loanFajar = await Loan.create({
        employeeId: empFajar._id,
        amountRequested: 3000000,
        tenorMonths: 3,
        monthlyDeduction: 1000000,
        reason: "Biaya perbaikan rumah pasca banjir (Seeder Mei)",
        status: "APPROVED",
        disbursementDate: new Date("2026-05-10"),
      });

      await LoanApproval.create([
        {
          loanId: loanFajar._id,
          step: "MANAGER_KEUANGAN",
          approverId,
          status: "APPROVED",
          actionDate: new Date("2026-05-10"),
        },
      ]);
      await LoanPayment.insertMany([
        {
          loanId: loanFajar._id,
          employeeId: empFajar._id,
          installmentNumber: 1,
          amount: 1000000,
          periodMonth: "2026-05",
          isPaid: true,
          paidAt: new Date("2026-05-25"),
        },
        {
          loanId: loanFajar._id,
          employeeId: empFajar._id,
          installmentNumber: 2,
          amount: 1000000,
          periodMonth: "2026-06",
          isPaid: false,
          paidAt: null,
        },
        {
          loanId: loanFajar._id,
          employeeId: empFajar._id,
          installmentNumber: 3,
          amount: 1000000,
          periodMonth: "2026-07",
          isPaid: false,
          paidAt: null,
        },
      ]);
      console.log("⭐ [AKTIF] Data pinjaman Fajar Janiko (Cair Mei) berhasil disuntikkan.");
    }

    // 2. ADINDA RISMAYANI (Punya 2 Cicilan Aktif/Belum Dibayar Sekaligus di Juni 2026)
    const empAdinda = empMap["adindarismayani"];
    if (empAdinda) {
      // 📌 PINJAMAN A (Cair Mei, di bulan Juni bayar angsuran ke-2)
      const loanAdindaA = await Loan.create({
        employeeId: empAdinda._id,
        amountRequested: 3000000,
        tenorMonths: 3,
        monthlyDeduction: 1000000,
        reason: "Biaya pendaftaran sekolah anak (Pinjaman A Cair Mei)",
        status: "APPROVED",
        disbursementDate: new Date("2026-05-12"),
      });

      // 📌 PINJAMAN B (Cair Juni, di bulan Juni langsung bayar angsuran ke-1)
      const loanAdindaB = await Loan.create({
        employeeId: empAdinda._id,
        amountRequested: 1500000,
        tenorMonths: 3,
        monthlyDeduction: 500000,
        reason: "Kebutuhan mendesak pengobatan keluarga (Pinjaman B Cair Juni)",
        status: "APPROVED",
        disbursementDate: new Date("2026-06-05"),
      });

      await LoanApproval.create([
        {
          loanId: loanAdindaA._id,
          step: "MANAGER_KEUANGAN",
          approverId,
          status: "APPROVED",
          actionDate: new Date("2026-05-12"),
        },
        {
          loanId: loanAdindaB._id,
          step: "MANAGER_KEUANGAN",
          approverId,
          status: "APPROVED",
          actionDate: new Date("2026-06-05"),
        },
      ]);

      await LoanPayment.insertMany([
        // Jadwal Pinjaman A (Cicilan ke-2 jatuh di Juni & BELUM DIBAYAR)
        {
          loanId: loanAdindaA._id,
          employeeId: empAdinda._id,
          installmentNumber: 1,
          amount: 1000000,
          periodMonth: "2026-05",
          isPaid: true,
          paidAt: new Date("2026-05-25"),
        },
        {
          loanId: loanAdindaA._id,
          employeeId: empAdinda._id,
          installmentNumber: 2,
          amount: 1000000,
          periodMonth: "2026-06",
          isPaid: false,
          paidAt: null,
        },
        {
          loanId: loanAdindaA._id,
          employeeId: empAdinda._id,
          installmentNumber: 3,
          amount: 1000000,
          periodMonth: "2026-07",
          isPaid: false,
          paidAt: null,
        },

        // Jadwal Pinjaman B (Cicilan ke-1 langsung nembak Juni & BELUM DIBAYAR)
        {
          loanId: loanAdindaB._id,
          employeeId: empAdinda._id,
          installmentNumber: 1,
          amount: 500000,
          periodMonth: "2026-06",
          isPaid: false,
          paidAt: null,
        },
        {
          loanId: loanAdindaB._id,
          employeeId: empAdinda._id,
          installmentNumber: 2,
          amount: 500000,
          periodMonth: "2026-07",
          isPaid: false,
          paidAt: null,
        },
        {
          loanId: loanAdindaB._id,
          employeeId: empAdinda._id,
          installmentNumber: 3,
          amount: 500000,
          periodMonth: "2026-08",
          isPaid: false,
          paidAt: null,
        },
      ]);
      console.log(
        "⭐ [DOUBLE ACTIVE] Adinda Rismayani sukses memiliki 2 cicilan terbuka di periode 2026-06!"
      );
    }

    // 3. ABDUL AZIZ (Skenario Pending untuk Demo Kelola Fitur Approval)
    const empAziz = empMap["abdulaziz"];
    if (empAziz) {
      await Loan.create({
        employeeId: empAziz._id,
        amountRequested: 2000000,
        tenorMonths: 2,
        monthlyDeduction: 1000000,
        reason: "Pengajuan dana darurat untuk biaya pengobatan rawat inap",
        status: "PENDING",
        disbursementDate: null,
      });
      console.log("⭐ [PENDING] Data pengajuan Abdul Aziz berhasil disuntikkan.");
    }

    // 4. MELTI SUNDARI (Aktif - Bulan Juni Bayar Cicilan Ke-2)
    const empMelti = empMap["meltisundari"];
    if (empMelti) {
      const loanMelti = await Loan.create({
        employeeId: empMelti._id,
        amountRequested: 3000000,
        tenorMonths: 3,
        monthlyDeduction: 1000000,
        reason: "Kebutuhan renovasi tempat tinggal (Seeder Mei)",
        status: "APPROVED",
        disbursementDate: new Date("2026-05-15"),
      });
      await LoanPayment.insertMany([
        {
          loanId: loanMelti._id,
          employeeId: empMelti._id,
          installmentNumber: 1,
          amount: 1000000,
          periodMonth: "2026-05",
          isPaid: true,
          paidAt: new Date("2026-05-25"),
        },
        {
          loanId: loanMelti._id,
          employeeId: empMelti._id,
          installmentNumber: 2,
          amount: 1000000,
          periodMonth: "2026-06",
          isPaid: false,
          paidAt: null,
        },
        {
          loanId: loanMelti._id,
          employeeId: empMelti._id,
          installmentNumber: 3,
          amount: 1000000,
          periodMonth: "2026-07",
          isPaid: false,
          paidAt: null,
        },
      ]);
      console.log("⭐ [AKTIF] Data pinjaman Melti Sundari berhasil disuntikkan.");
    }

    // 5. BASO HERMAN (Aktif - Bulan Juni Bayar Cicilan Ke-2)
    const empBaso = empMap["basoherman"];
    if (empBaso) {
      const loanBaso = await Loan.create({
        employeeId: empBaso._id,
        amountRequested: 3000000,
        tenorMonths: 3,
        monthlyDeduction: 1000000,
        reason: "Biaya service rutin kendaraan operasional (Seeder Mei)",
        status: "APPROVED",
        disbursementDate: new Date("2026-05-15"),
      });
      await LoanPayment.insertMany([
        {
          loanId: loanBaso._id,
          employeeId: empBaso._id,
          installmentNumber: 1,
          amount: 1000000,
          periodMonth: "2026-05",
          isPaid: true,
          paidAt: new Date("2026-05-25"),
        },
        {
          loanId: loanBaso._id,
          employeeId: empBaso._id,
          installmentNumber: 2,
          amount: 1000000,
          periodMonth: "2026-06",
          isPaid: false,
          paidAt: null,
        },
        {
          loanId: loanBaso._id,
          employeeId: empBaso._id,
          installmentNumber: 3,
          amount: 1000000,
          periodMonth: "2026-07",
          isPaid: false,
          paidAt: null,
        },
      ]);
      console.log("⭐ [AKTIF] Data pinjaman Baso Herman berhasil disuntikkan.");
    }

    console.log("\nSEEDING SELESAI: Data kombinasi sukses dikonfigurasi untuk sidang!");
  } catch (error) {
    console.error("Terjadi kegagalan seeding data kombinasi:", error);
  }
};

export default completeLoanSeeder;
