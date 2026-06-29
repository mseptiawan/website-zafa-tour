import Loan from "../models/loan/Loan.model.js";
import Employee from "../models/employee/Employee.model.js";
import LoanApproval from "../models/loan/LoanApproval.model.js";
import LoanPayment from "../models/loan/loanPayment.model.js";
import EmployeeSalary from "../models/employee/EmployeeSalary.model.js";
import User from "../models/basic/User.model.js";
import Role from "../models/basic/Role.model.js";
import { getTotalMonthlyDeduction } from "../helpers/loan.helper.js";

const LOAN_WORKFLOW = ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA", "MANAGER_KEUANGAN"];
class LoanService {
  async getNextLoanApprover(currentStep) {
    if (!currentStep) {
      const roleDoc = await Role.findOne({ name: "WAKIL_DIREKTUR" });
      if (!roleDoc) return { nextStep: "WAKIL_DIREKTUR", nextApproverId: null };
      const approver = await User.findOne({ roleId: roleDoc._id });
      return { nextStep: "WAKIL_DIREKTUR", nextApproverId: approver ? approver._id : null };
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
    if (!employee) throw new Error("Data Pegawai tidak ditemukan");

    const employeeObj = employee.toObject();

    const salaryData = await EmployeeSalary.findOne({ employeeId: employeeObj._id });

    employeeObj.basicSalary = salaryData ? salaryData.basicSalary : 0;

    return employeeObj;
  }
  async createLoan(employeeId, loanData, userRole = "") {
    if (!employeeId)
      throw new Error("Data Pegawai tidak ditemukan atau Anda tidak terdaftar sebagai pegawai");

    const salary = await EmployeeSalary.findOne({ employeeId: employeeId });
    const existingMonthlyCommitment = await getTotalMonthlyDeduction(employeeId);
    const basicSalary = salary ? salary.basicSalary : 0;

    const amountRequested = Number(loanData.amountRequested) || 0;
    const tenorMonths = Number(loanData.tenorMonths) || 0;
    const { reason } = loanData;

    if (!reason || reason.trim().length < 15) {
      throw new Error(
        "Alasan peminjaman terlalu pendek. Harap berikan penjelasan yang jelas (minimal 15 karakter)."
      );
    }

    const maxLoan = basicSalary * 3;
    if (amountRequested > maxLoan) {
      throw new Error(
        `Pengajuan ditolak. Jumlah pinjaman (Rp ${amountRequested.toLocaleString("id-ID")}) melebihi batas maksimal 3 kali gaji pokok Anda (Maksimal Rp ${maxLoan.toLocaleString("id-ID")}).`
      );
    }

    if (tenorMonths < 1 || tenorMonths > 12) {
      throw new Error("Pengajuan ditolak. Tenor pinjaman harus di antara 1 sampai 12 bulan.");
    }

    const monthlyDeduction = Math.ceil(amountRequested / tenorMonths);
    const maxDeduction = basicSalary * 0.3;

    const totalMonthlyAfterLoan = existingMonthlyCommitment + monthlyDeduction;

    if (totalMonthlyAfterLoan > maxDeduction) {
      throw new Error(
        `Pengajuan ditolak. Total cicilan bulanan Anda saat ini (existing Rp ${existingMonthlyCommitment.toLocaleString("id-ID")} + pengajuan baru Rp ${monthlyDeduction.toLocaleString("id-ID")} = Rp ${totalMonthlyAfterLoan.toLocaleString("id-ID")}) melebihi batas 30% gaji (Rp ${maxDeduction.toLocaleString("id-ID")}).`
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

    const initialStep = userRole === "WAKIL_DIREKTUR" ? "WAKIL_DIREKTUR" : null;
    const { nextStep, nextApproverId } = await this.getNextLoanApprover(initialStep);

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
    if (!employee) throw new Error("Data pegawai tidak ditemukan");

    const employeeId = employee._id;

    const salaryDoc = await EmployeeSalary.findOne({ employeeId });
    const basicSalary = salaryDoc ? salaryDoc.basicSalary : 0;
    const limit = basicSalary * 0.3;

    const loans = await Loan.find({ employeeId }).sort({ createdAt: -1 });

    const unpaidPayments = await LoanPayment.find({ employeeId, isPaid: false });

    const activeLoanIds = [...new Set(unpaidPayments.map((p) => p.loanId.toString()))];

    const activeLoansData = await Loan.find({ _id: { $in: activeLoanIds } });
    const activeLoan = activeLoansData.reduce((sum, loan) => sum + loan.amountRequested, 0);

    const paidPayments = await LoanPayment.find({ employeeId, isPaid: true });
    const totalPaidAmount = paidPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const rawRemainingDebt = activeLoan - totalPaidAmount;
    const remainingDebt = rawRemainingDebt < 0 ? 0 : rawRemainingDebt;

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const currentMonthPayment = unpaidPayments.find((p) => p.periodMonth === currentPeriod);
    const installmentThisMonth = currentMonthPayment ? currentMonthPayment.amount : 0;

    return {
      loans,
      summary: {
        limit,
        maxLoan: basicSalary * 3,
        activeLoan,
        installmentThisMonth,
        remainingDebt,
      },
    };
  }
  async getLoanDetailData(loanId) {
    const loan = await Loan.findById(loanId).populate({
      path: "employeeId",
      populate: {
        path: "careerData",
        model: "EmployeeCareer",
        populate: [{ path: "unitId" }, { path: "bidangId" }],
      },
    });

    if (!loan) throw new Error("Data pengajuan pinjaman tidak ditemukan");

    const approvals = await LoanApproval.find({ loanId })
      .populate({
        path: "approverId",
        populate: {
          path: "employeeData",
          model: "Employee",
          select: "fullName",
        },
      })
      .sort({ createdAt: 1 });

    const payments = await LoanPayment.find({ loanId }).sort({ installmentNumber: 1 });

    return { loan, approvals, payments };
  }
  async getLoanForEdit(loanId, userId) {
    const employee = await Employee.findOne({ userId });
    if (!employee) throw new Error("Data pegawai tidak ditemukan");

    const loan = await Loan.findOne({ _id: loanId, employeeId: employee._id });
    if (!loan) throw new Error("Data pengajuan tidak ditemukan");

    if (loan.status !== "PENDING") {
      throw new Error("Pengajuan yang sudah diproses tidak dapat diubah");
    }

    const wakilDirekturApproval = await LoanApproval.findOne({ loanId, step: "WAKIL_DIREKTUR" });
    if (wakilDirekturApproval && wakilDirekturApproval.status !== "PENDING") {
      throw new Error("Pengajuan tidak bisa diubah karena sudah diproses oleh WAKIL_DIREKTUR");
    }

    const salaryDoc = await EmployeeSalary.findOne({ employeeId: employee._id });
    const basicSalary = salaryDoc ? salaryDoc.basicSalary : 0;

    return { loan, basicSalary };
  }

  async updateLoan(loanId, userId, updateData) {
    const amountRequested = Number(updateData.amountRequested) || 0;
    const tenorMonths = Number(updateData.tenorMonths) || 0;
    const reason = updateData.reason;

    if (!reason || reason.trim().length < 15) {
      throw new Error(
        "Alasan peminjaman terlalu pendek. Harap berikan penjelasan yang jelas (minimal 15 karakter)."
      );
    }

    if (tenorMonths < 1 || tenorMonths > 12) {
      throw new Error("Pengajuan ditolak. Tenor pinjaman harus di antara 1 sampai 12 bulan.");
    }

    const employee = await Employee.findOne({ userId });
    if (!employee) throw new Error("Data pegawai tidak ditemukan");

    const loan = await Loan.findOne({ _id: loanId, employeeId: employee._id });
    if (!loan) throw new Error("Data pengajuan tidak ditemukan");

    if (loan.status !== "PENDING") {
      throw new Error("Pengajuan yang sudah diproses tidak dapat diubah");
    }

    const wakilDirekturApproval = await LoanApproval.findOne({ loanId, step: "WAKIL_DIREKTUR" });
    if (wakilDirekturApproval && wakilDirekturApproval.status !== "PENDING") {
      throw new Error("Pengajuan tidak bisa diubah karena sudah diproses oleh WAKIL_DIREKTUR");
    }

    const salary = await EmployeeSalary.findOne({ employeeId: employee._id });
    const basicSalary = salary ? salary.basicSalary : 0;

    const maxLoan = basicSalary * 3;
    if (amountRequested > maxLoan) {
      throw new Error(
        `Pengajuan ditolak. Jumlah pinjaman (Rp ${amountRequested.toLocaleString("id-ID")}) melebihi batas maksimal 3 kali gaji pokok Anda (Maksimal Rp ${maxLoan.toLocaleString("id-ID")}).`
      );
    }

    const monthlyDeduction = Math.ceil(amountRequested / tenorMonths);
    const maxDeduction = basicSalary * 0.3;

    if (monthlyDeduction > maxDeduction) {
      throw new Error(
        `Pengajuan ditolak. Cicilan bulanan (Rp ${monthlyDeduction.toLocaleString("id-ID")}) melebihi batas maksimal 30% dari gaji pokok Anda (Maksimal Rp ${maxDeduction.toLocaleString("id-ID")}/bulan).`
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

    const approvals = await LoanApproval.find({ step: roleName }).sort({ createdAt: -1 });
    const loanIds = approvals.map((app) => app.loanId);

    const loans = await Loan.find({
      _id: { $in: loanIds },
      status: { $ne: "CANCELLED" },
    }).populate({
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

  async processApproval(approvalId, sessionUser, note) {
    const approval = await LoanApproval.findOne({ _id: approvalId, status: "PENDING" });
    if (!approval) throw new Error("Antrean tidak ditemukan atau sudah diproses.");

    const userRole = (sessionUser.role || "").toString().trim().toUpperCase();
    if (approval.step !== userRole) {
      throw new Error(`Anda tidak memiliki otoritas. Tahap saat ini: ${approval.step}`);
    }

    const loan = await Loan.findById(approval.loanId);
    if (!loan) throw new Error("Data pinjaman terkait tidak ditemukan.");

    const salary = await EmployeeSalary.findOne({ employeeId: loan.employeeId });
    const basicSalary = salary ? salary.basicSalary : 0;

    if (loan.amountRequested > basicSalary * 3 || loan.monthlyDeduction > basicSalary * 0.3) {
      throw new Error(
        "Persetujuan dibatalkan sistem. Profil finansial pegawai saat ini sudah tidak memenuhi syarat limit loan."
      );
    }

    approval.status = "APPROVED";
    approval.note = note || "";
    approval.approverId = sessionUser._id;
    approval.actionDate = new Date();
    await approval.save();

    const { nextStep, nextApproverId } = await this.getNextLoanApprover(approval.step);

    if (nextStep) {
      await LoanApproval.create({
        loanId: approval.loanId,
        step: nextStep,
        approverId: nextApproverId,
        status: "PENDING",
      });
    } else {
      await Loan.findByIdAndUpdate(approval.loanId, { status: "APPROVED" });
    }
    return true;
  }
  async processReject(approvalId, sessionUser, note) {
    const approval = await LoanApproval.findOne({ _id: approvalId, status: "PENDING" });
    if (!approval) throw new Error("Antrean tidak ditemukan atau sudah diproses.");

    const userRole = (sessionUser.role || "").toString().trim().toUpperCase();
    if (approval.step !== userRole) {
      throw new Error(`Anda tidak memiliki otoritas. Tahap saat ini: ${approval.step}`);
    }

    approval.status = "REJECTED";
    approval.note = note || "Ditolak oleh sistem";
    approval.approverId = sessionUser._id;
    approval.actionDate = new Date();
    await approval.save();

    await Loan.findByIdAndUpdate(approval.loanId, { status: "REJECTED" });

    return true;
  }
  async processDisbursement(approvalId, sessionUser, note, file) {
    if (!file) throw new Error("Bukti transfer wajib diunggah.");

    const approval = await LoanApproval.findOne({
      _id: approvalId,
      step: "MANAGER_KEUANGAN",
      status: "PENDING",
    });
    if (!approval) throw new Error("Antrean pencairan tidak ditemukan.");

    approval.status = "APPROVED";
    approval.note = note || "Dana telah ditransfer.";
    approval.approverId = sessionUser._id;
    approval.actionDate = new Date();
    await approval.save();

    const loan = await Loan.findById(approval.loanId);
    if (!loan) throw new Error("Data pinjaman tidak ditemukan.");

    loan.status = "APPROVED";
    loan.disbursementDate = new Date();
    loan.paymentProof = `/uploads/files/${file.filename}`;
    await loan.save();

    const paymentRecords = [];
    const startMonth = new Date();

    for (let i = 1; i <= loan.tenorMonths; i++) {
      const nextDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
      const periodMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;

      paymentRecords.push({
        loanId: loan._id,
        employeeId: loan.employeeId,
        installmentNumber: i,
        amount: loan.monthlyDeduction,
        periodMonth: periodMonth,
        isPaid: false,
      });
    }

    await LoanPayment.insertMany(paymentRecords);

    return true;
  }
  async cancelLoan(loanId, userId) {
    if (!userId) {
      throw new Error("Sesi pengguna tidak valid, silakan login ulang");
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      throw new Error("Data pengajuan pinjaman tidak ditemukan");
    }

    const employee = await Employee.findOne({ userId: userId });
    if (!employee) {
      throw new Error("Data pegawai tidak ditemukan untuk akun Anda");
    }

    if (loan.employeeId.toString() !== employee._id.toString()) {
      throw new Error("Anda tidak memiliki akses untuk membatalkan pengajuan ini");
    }

    if (loan.status === "APPROVED") {
      throw new Error(
        "Pengajuan tidak dapat dibatalkan karena telah disetujui oleh manajemen atau dalam proses pencairan."
      );
    }

    if (loan.status === "REJECTED" || loan.status === "CANCELLED") {
      throw new Error(`Pengajuan sudah berstatus ${loan.status}`);
    }

    loan.status = "CANCELLED";
    await loan.save();

    await LoanApproval.updateMany(
      { loanId: loan._id, status: "PENDING" },
      {
        status: "CANCELLED",
        approverId: null,
        note: "Dibatalkan oleh pemohon",
      }
    );

    return loan;
  }
}

export default new LoanService();
