import mongoose from "mongoose";

import Loan from "../../models/loan/Loan.model.js";
import LoanApproval from "../../models/loan/LoanApproval.model.js";
import LoanPayment from "../../models/loan/loanPayment.model.js";

import Employee from "../../models/employee/Employee.model.js";
import EmployeeSalary from "../../models/employee/EmployeeSalary.model.js";
import User from "../../models/basic/User.model.js";
import Role from "../../models/basic/Role.model.js";

/**
 * CONFIG WORKFLOW
 */
const WORKFLOW = ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA", "MANAGER_KEUANGAN"];

/**
 * Helper: get role + user
 */
async function getUserByRole(roleName) {
  const role = await Role.findOne({ name: roleName });
  if (!role) throw new Error(`Role ${roleName} tidak ditemukan`);

  const user = await User.findOne({ roleId: role._id });
  if (!user) throw new Error(`User dengan role ${roleName} tidak ditemukan`);

  return user;
}

/**
 * MAIN SEED FUNCTION
 */
export async function seedLoanSystem() {
  try {
    console.log("🚀 Starting Loan Seeder...");

    // =========================================================
    // 1. AMBIL EMPLOYEE SAMPLE
    // =========================================================
    const employee = await Employee.findOne({});
    if (!employee) throw new Error("Tidak ada employee di database");

    // set salary jika belum ada
    let salary = await EmployeeSalary.findOne({ employeeId: employee._id });

    if (!salary) {
      salary = await EmployeeSalary.create({
        employeeId: employee._id,
        basicSalary: 5000000, // 5 juta
      });
    }

    const basicSalary = salary.basicSalary;

    // =========================================================
    // 2. HITUNG LOAN SAMPLE SESUAI RULE
    // =========================================================
    const amountRequested = basicSalary * 2; // aman (max 3x)
    const tenorMonths = 6;
    const monthlyDeduction = Math.ceil(amountRequested / tenorMonths);

    const reason = "Dana pinjaman untuk kebutuhan renovasi rumah keluarga mendesak";

    // =========================================================
    // 3. CREATE LOAN
    // =========================================================
    const loan = await Loan.create({
      employeeId: employee._id,
      amountRequested,
      tenorMonths,
      monthlyDeduction,
      reason,
      status: "PENDING",
    });

    console.log("✅ Loan created:", loan._id);

    // =========================================================
    // 4. CREATE APPROVAL CHAIN
    // =========================================================
    const approvals = [];

    for (let i = 0; i < WORKFLOW.length; i++) {
      const roleName = WORKFLOW[i];
      const user = await getUserByRole(roleName);

      approvals.push({
        loanId: loan._id,
        step: roleName,
        approverId: i === 0 ? user._id : null,
        status: i === 0 ? "PENDING" : "PENDING",
      });
    }

    await LoanApproval.insertMany(approvals);

    console.log("✅ Approval chain created");

    // =========================================================
    // 5. SIMULASI APPROVAL STEP 1 & 2 (OPTIONAL)
    // =========================================================
    const step1 = await LoanApproval.findOne({
      loanId: loan._id,
      step: "WAKIL_DIREKTUR",
    });

    step1.status = "APPROVED";
    step1.approverId = (await getUserByRole("WAKIL_DIREKTUR"))._id;
    step1.actionDate = new Date();
    await step1.save();

    const step2 = await LoanApproval.findOne({
      loanId: loan._id,
      step: "DIREKTUR_UTAMA",
    });

    step2.status = "APPROVED";
    step2.approverId = (await getUserByRole("DIREKTUR_UTAMA"))._id;
    step2.actionDate = new Date();
    await step2.save();

    console.log("✅ Step 1 & 2 approved");

    // =========================================================
    // 6. FINAL APPROVAL (MANAGER KEUANGAN)
    // =========================================================
    const financeUser = await getUserByRole("MANAGER_KEUANGAN");

    const financeApproval = await LoanApproval.findOne({
      loanId: loan._id,
      step: "MANAGER_KEUANGAN",
    });

    financeApproval.status = "APPROVED";
    financeApproval.approverId = financeUser._id;
    financeApproval.actionDate = new Date();
    await financeApproval.save();

    loan.status = "APPROVED_BY_MANAGEMENT";
    await loan.save();

    console.log("✅ Final approval done");

    // =========================================================
    // 7. CREATE PAYMENT SCHEDULE
    // =========================================================
    const payments = [];

    const startDate = new Date();

    for (let i = 1; i <= tenorMonths; i++) {
      const next = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);

      const periodMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;

      payments.push({
        loanId: loan._id,
        employeeId: employee._id,
        installmentNumber: i,
        amount: monthlyDeduction,
        periodMonth,
        isPaid: false,
      });
    }

    await LoanPayment.insertMany(payments);

    console.log("✅ Payment schedule created");

    console.log("🎉 SEED COMPLETED SUCCESSFULLY");
  } catch (err) {
    console.error("❌ Seeder Error:", err.message);
  }
}
