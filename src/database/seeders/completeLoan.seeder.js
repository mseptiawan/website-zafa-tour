import mongoose from "mongoose";
import User from "../../models/basic/User.model.js";
import Role from "../../models/basic/Role.model.js";
import Bidang from "../../models/basic/Bidang.model.js";
import Employee from "../../models/employee/Employee.model.js";
import EmployeeSalary from "../../models/employee/EmployeeSalary.model.js";
import Loan from "../../models/loan/Loan.model.js";
import LoanApproval from "../../models/loan/LoanApproval.model.js";
import LoanPayment from "../../models/loan/loanPayment.model.js";

// =========================================================================
// SUNTIKAN IMPOR PAKSA AGAR SKEMA REGISTER KE MEMORI MONGOOSE RUNTIME
// =========================================================================
import EmployeeCareer from "../../models/employee/EmployeeCareer.js";
import Position from "../../models/basic/Position.model.js";

const completeLoanSeeder = async () => {
  try {
    await Loan.deleteMany({});
    await LoanApproval.deleteMany({});
    await LoanPayment.deleteMany({});

    console.log("Data transaksi pinjaman masa lalu berhasil dibersihkan.");

    const targetKeys = ["ongkidwi", "fajarjaniko", "abdulaziz"];
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

    console.log(
      `👥 Berhasil memetakan ${employeeDocs.length} profil target untuk simulasi sidang.`
    );

    // =========================================================================
    // 2. INJEKSI DATA TRANSAKSI KOMBINASI (STRATEGI DEMO SIDANG)
    // =========================================================================

    const empOngki = empMap["ongkidwi"];
    if (empOngki) {
      const loanOngki = await Loan.create({
        employeeId: empOngki._id,
        amountRequested: 3000000,
        tenorMonths: 3,
        monthlyDeduction: 1000000,
        reason: "Keperluan mendesak perbaikan perangkat laptop workstation penunjang",
        status: "APPROVED",
        disbursementDate: new Date("2026-02-27"),
      });

      await LoanApproval.create([
        {
          loanId: loanOngki._id,
          step: "WAKIL_DIREKTUR",
          approverId,
          status: "APPROVED",
          actionDate: new Date("2026-02-25"),
        },
        {
          loanId: loanOngki._id,
          step: "MANAGER_KEUANGAN",
          approverId,
          status: "APPROVED",
          actionDate: new Date("2026-02-27"),
        },
      ]);

      await LoanPayment.insertMany([
        {
          loanId: loanOngki._id,
          employeeId: empOngki._id,
          installmentNumber: 1,
          amount: 1000000,
          periodMonth: "2026-03",
          isPaid: true,
          paidAt: new Date("2026-03-26"),
        },
        {
          loanId: loanOngki._id,
          employeeId: empOngki._id,
          installmentNumber: 2,
          amount: 1000000,
          periodMonth: "2026-04",
          isPaid: true,
          paidAt: new Date("2026-04-26"),
        },
        {
          loanId: loanOngki._id,
          employeeId: empOngki._id,
          installmentNumber: 3,
          amount: 1000000,
          periodMonth: "2026-05",
          isPaid: true,
          paidAt: new Date("2026-05-26"),
        },
      ]);
      console.log("⭐ [LUNAS] Data pinjaman historis Ongki Dwi berhasil disuntikkan.");
    }

    const empFajar = empMap["fajarjaniko"];
    if (empFajar) {
      const loanFajar = await Loan.create({
        employeeId: empFajar._id,
        amountRequested: 4000000,
        tenorMonths: 4,
        monthlyDeduction: 1000000,
        reason: "Biaya renovasi rumah dan perbaikan fasilitas sanitasi tempat tinggal",
        status: "APPROVED",
        disbursementDate: new Date("2026-04-28"),
      });

      await LoanApproval.create([
        {
          loanId: loanFajar._id,
          step: "MANAGER_KEUANGAN",
          approverId,
          status: "APPROVED",
          actionDate: new Date("2026-04-27"),
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
        {
          loanId: loanFajar._id,
          employeeId: empFajar._id,
          installmentNumber: 4,
          amount: 1000000,
          periodMonth: "2026-08",
          isPaid: false,
          paidAt: null,
        },
      ]);
      console.log("⭐ [AKTIF] Data pinjaman berjalan Fajar Janiko berhasil disuntikkan.");
    }

    const empAziz = empMap["abdulaziz"];
    if (empAziz) {
      let baseSalaryInfo = 0;
      try {
        const currentSalary = await EmployeeSalary.findOne({ employeeId: empAziz._id });
        if (currentSalary) baseSalaryInfo = currentSalary.basicSalary;
      } catch (err) {
        baseSalaryInfo = 0;
      }

      await Loan.create({
        employeeId: empAziz._id,
        amountRequested: 2000000,
        tenorMonths: 2,
        monthlyDeduction: 1000000,
        reason: "Pengajuan dana darurat untuk biaya pengobatan rawat inap anggota keluarga",
        status: "PENDING",
        disbursementDate: null,
      });
      console.log(
        `PENDING] Data pengajuan Abdul Aziz berhasil disuntikkan (Gaji terikat di DB: Rp ${baseSalaryInfo.toLocaleString("id-ID")}).`
      );
    }

    console.log("\nSEEDING SELESAI: Data kombinasi sukses dikonfigurasi untuk sidang!");
    // process.exit(0);
  } catch (error) {
    console.error("Terjadi kegagalan seeding data kombinasi:", error);
    // process.exit(1);
  }
};

export default completeLoanSeeder;
