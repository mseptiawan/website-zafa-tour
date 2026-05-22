import Loan from "../models/loan/Loan.model.js";
import Employee from "../models/Employee.js";
import LoanApproval from "../models/loan/LoanApproval.model.js";

class LoanService {
  async getEmployeeForForm(userId) {
    const employee = await Employee.findOne({ userId });
    if (!employee) throw new Error("Data karyawan tidak ditemukan");
    return employee;
  }

  async createLoan(userId, loanData) {
    const employee = await Employee.findOne({ userId });
    if (!employee) throw new Error("Data karyawan tidak ditemukan");

    const { amountRequested, tenorMonths, reason } = loanData;

    const monthlyDeduction = Math.ceil(amountRequested / tenorMonths);
    const maxDeduction = employee.baseSalary * 0.1;
    if (monthlyDeduction > maxDeduction) {
      throw new Error(
        `Pengajuan ditolak. Cicilan bulanan (Rp ${monthlyDeduction.toLocaleString()}) melebihi batas maksimal 10% dari gaji pokok Anda.`
      );
    }

    const newLoan = await Loan.create({
      employeeId: employee._id,
      amountRequested,
      tenorMonths,
      monthlyDeduction,
      reason,
    });

    await LoanApproval.create({
      loanId: newLoan._id,
      step: "HR",
      status: "PENDING",
    });

    return newLoan;
  }

  async getEmployeeLoanHistory(userId) {
    const employee = await Employee.findOne({ userId });
    if (!employee) throw new Error("Data karyawan tidak ditemukan");

    return await Loan.find({ employeeId: employee._id }).sort({ createdAt: -1 });
  }

  async getLoanForEdit(loanId, userId) {
    const employee = await Employee.findOne({ userId });
    const loan = await Loan.findOne({ _id: loanId, employeeId: employee._id });

    if (!loan) throw new Error("Data pengajuan tidak ditemukan");
    if (loan.status !== "PENDING")
      throw new Error("Pengajuan yang sudah diproses tidak dapat diubah");

    return loan;
  }

  async updateLoan(loanId, userId, updateData) {
    const employee = await Employee.findOne({ userId });
    const loan = await Loan.findOne({ _id: loanId, employeeId: employee._id });

    if (!loan) throw new Error("Data pengajuan tidak ditemukan");
    if (loan.status !== "PENDING")
      throw new Error("Pengajuan yang sudah diproses tidak dapat diubah");

    const { amountRequested, tenorMonths, reason } = updateData;
    const monthlyDeduction = Math.ceil(amountRequested / tenorMonths);

    const maxDeduction = employee.baseSalary * 0.1;
    if (monthlyDeduction > maxDeduction) {
      throw new Error(
        `Cicilan baru (Rp ${monthlyDeduction.toLocaleString()}) melebihi batas 10% gaji pokok.`
      );
    }

    loan.amountRequested = amountRequested;
    loan.tenorMonths = tenorMonths;
    loan.monthlyDeduction = monthlyDeduction;
    loan.reason = reason;

    return await loan.save();
  }
}

export default new LoanService();
