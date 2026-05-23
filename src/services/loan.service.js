import Loan from "../models/loan/Loan.model.js";
import Employee from "../models/employee/Employee.model.js";
import LoanApproval from "../models/loan/LoanApproval.model.js";
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

    const salary = await EmployeeSalary.findOne({ employeeId: employee._id });
    const basicSalary = salary ? salary.basicSalary : 0;

    const { amountRequested, tenorMonths, reason } = updateData;
    const monthlyDeduction = Math.ceil(amountRequested / tenorMonths);

    const maxDeduction = basicSalary * 0.1;
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
