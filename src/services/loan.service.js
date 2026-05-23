import Loan from "../models/loan/Loan.model.js";
import Employee from "../models/employee/Employee.model.js";
import LoanApproval from "../models/loan/LoanApproval.model.js";
import LoanPayment from "../models/loan/loanPayment.model.js";
import EmployeeSalary from "../models/employee/EmployeeSalary.model.js";
import User from "../models/basic/User.js";
import Role from "../models/basic/Role.js";

const LOAN_WORKFLOW = ["HR", "PIMPINAN", "KEUANGAN"];

class LoanService {
  async getNextLoanApprover(currentStep) {
    if (!currentStep) {
      const roleDoc = await Role.findOne({ name: "HR" });
      if (!roleDoc) return { nextStep: "HR", nextApproverId: null };
      const approver = await User.findOne({ roleId: roleDoc._id });
      return { nextStep: "HR", nextApproverId: approver ? approver._id : null };
    }

    const currentIndex = LOAN_WORKFLOW.indexOf(currentStep);
    if (currentIndex !== -1 && currentIndex < LOAN_WORKFLOW.length - 1) {
      const nextStep = LOAN_WORKFLOW[currentIndex + 1];
      const roleDoc = await Role.findOne({ name: nextStep });
      if (!roleDoc) return { nextStep, nextApproverId: null };
      const approver = await User.findOne({ roleId: roleDoc._id });
      return { nextStep, nextApproverId: approver ? approver._id : null };
    }

    return { nextStep: null, nextApproverId: null };
  }

  async getEmployeeForForm(userId) {
    const employee = await Employee.findOne({ userId });
    if (!employee) throw new Error("Data karyawan tidak ditemukan");

    return employee.toObject();
  }

  async createLoan(employeeId, loanData) {
    if (!employeeId)
      throw new Error("Data karyawan tidak ditemukan atau Anda tidak terdaftar sebagai karyawan");

    const salary = await EmployeeSalary.findOne({ employeeId: employeeId });
    const basicSalary = salary ? salary.basicSalary : 0;

    const { amountRequested, tenorMonths, reason } = loanData;
    const monthlyDeduction = Math.ceil(amountRequested / tenorMonths);

    const maxDeduction = basicSalary * 0.3;

    if (monthlyDeduction > maxDeduction) {
      throw new Error(
        `Pengajuan ditolak. Cicilan bulanan (Rp ${monthlyDeduction.toLocaleString()}) melebihi batas maksimal 30% dari gaji pokok Anda (Maksimal Rp ${maxDeduction.toLocaleString()}/bulan).`
      );
    }

    const newLoan = await Loan.create({
      employeeId: employeeId,
      amountRequested,
      tenorMonths,
      monthlyDeduction,
      reason,
      status: "PENDING",
    });

    const { nextStep, nextApproverId } = await this.getNextLoanApprover(null);

    await LoanApproval.create({
      loanId: newLoan._id,
      step: nextStep,
      approverId: nextApproverId,
      status: "PENDING",
    });

    return newLoan;
  }

  async getEmployeeLoanHistory(userId) {
    const employee = await Employee.findOne({ userId });
    if (!employee) throw new Error("Data karyawan tidak ditemukan");

    const employeeId = employee._id;

    const salaryDoc = await EmployeeSalary.findOne({ employeeId });
    const basicSalary = salaryDoc ? salaryDoc.basicSalary : 0;
    const limit = basicSalary * 0.3;

    const loans = await Loan.find({ employeeId }).sort({ createdAt: -1 });

    const unpaidPayments = await LoanPayment.find({ employeeId, isPaid: false });

    const activeLoanIds = [...new Set(unpaidPayments.map((p) => p.loanId.toString()))];

    const activeLoansData = await Loan.find({ _id: { $in: activeLoanIds } });
    const activeLoan = activeLoansData.reduce((sum, loan) => sum + loan.amountRequested, 0);

    const remainingDebt = unpaidPayments.reduce((sum, payment) => sum + payment.amount, 0);

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const currentMonthPayment = unpaidPayments.find((p) => p.periodMonth === currentPeriod);
    const installmentThisMonth = currentMonthPayment ? currentMonthPayment.amount : 0;

    return {
      loans,
      summary: {
        limit,
        activeLoan,
        installmentThisMonth,
        remainingDebt,
      },
    };
  }
  async getLoanDetailData(loanId) {
    const loan = await Loan.findById(loanId).populate({
      path: "employeeId",
      populate: { path: "unitId" },
    });
    if (!loan) throw new Error("Data pengajuan pinjaman tidak ditemukan");

    const approvals = await LoanApproval.find({ loanId })
      .populate("approverId")
      .sort({ createdAt: 1 });
    const payments = await LoanPayment.find({ loanId }).sort({ installmentNumber: 1 });

    return { loan, approvals, payments };
  }

  async getLoanForEdit(loanId, userId) {
    const employee = await Employee.findOne({ userId });
    if (!employee) throw new Error("Data karyawan tidak ditemukan");

    const loan = await Loan.findOne({ _id: loanId, employeeId: employee._id });
    if (!loan) throw new Error("Data pengajuan tidak ditemukan");

    if (loan.status !== "PENDING") {
      throw new Error("Pengajuan yang sudah diproses tidak dapat diubah");
    }

    const hrApproval = await LoanApproval.findOne({ loanId, step: "HR" });
    if (hrApproval && hrApproval.status !== "PENDING") {
      throw new Error("Pengajuan tidak bisa diubah karena sudah diproses oleh HR");
    }

    return loan;
  }

  async updateLoan(loanId, userId, updateData) {
    const employee = await Employee.findOne({ userId });
    if (!employee) throw new Error("Data karyawan tidak ditemukan");

    const loan = await Loan.findOne({ _id: loanId, employeeId: employee._id });
    if (!loan) throw new Error("Data pengajuan tidak ditemukan");

    if (loan.status !== "PENDING") {
      throw new Error("Pengajuan yang sudah diproses tidak dapat diubah");
    }

    const hrApproval = await LoanApproval.findOne({ loanId, step: "HR" });
    if (hrApproval && hrApproval.status !== "PENDING") {
      throw new Error("Pengajuan tidak bisa diubah karena sudah diproses oleh HR");
    }

    const salary = await EmployeeSalary.findOne({ employeeId: employee._id });
    const basicSalary = salary ? salary.basicSalary : 0;

    const amountRequested = Number(updateData.amountRequested);
    const tenorMonths = Number(updateData.tenorMonths);
    const reason = updateData.reason;

    const monthlyDeduction = Math.ceil(amountRequested / tenorMonths);
    const maxDeduction = basicSalary * 0.1;

    if (monthlyDeduction > maxDeduction) {
      throw new Error(
        `Cicilan baru (Rp ${monthlyDeduction.toLocaleString("id-ID")}) melebihi batas 10% gaji pokok.`
      );
    }

    loan.amountRequested = amountRequested;
    loan.tenorMonths = tenorMonths;
    loan.monthlyDeduction = monthlyDeduction;
    loan.reason = reason;

    return await loan.save();
  }

  async getLoanManagementData(user) {
    const roleName = (user.role || "").toString().trim().toUpperCase();

    console.log("Mencari data untuk Role:", roleName);

    const approvals = await LoanApproval.find({ step: roleName }).sort({ createdAt: -1 });
    const loanIds = approvals.map((app) => app.loanId);

    const loans = await Loan.find({ _id: { $in: loanIds } }).populate({
      path: "employeeId",
      select: "fullName",
    });

    const activeLoans = [];
    const historyLoans = [];
    for (const app of approvals) {
      const loan = loans.find((l) => l._id.toString() === app.loanId.toString());
      if (!loan) continue;

      const loanData = {
        ...loan.toObject(),
        approvalId: app._id,
        approvalStatus: app.status,
        note: app.note,
      };

      if (app.status === "PENDING") {
        activeLoans.push(loanData);
      } else {
        historyLoans.push(loanData);
      }
    }

    return { activeLoans, historyLoans };
  }
}

export default new LoanService();
