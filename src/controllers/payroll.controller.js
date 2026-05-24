import * as payrollService from "../services/payroll.service.js";
import Payroll from "../models/payroll/Payroll.model.js";

export const renderPayrollPage = async (req, res) => {
  try {
    const { employees, components } = await payrollService.getPayrollData();

    res.render("payroll/index", {
      title: "Manajemen Payroll",
      user: req.user,
      employees,
      components,
      currentMonth: "Juni 2026",
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export const savePayroll = async (req, res) => {
  try {
    const { employeeId, periodMonth, basicSalary, allowances, deductions } = req.body;

    if (!employeeId || !periodMonth) {
      return res.status(400).json({
        success: false,
        message: "ID Karyawan dan Periode Bulan wajib diisi.",
      });
    }

    const parseBasicSalary = parseFloat(basicSalary) || 0;

    const totalAllowances = allowances.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );
    const totalEarnings = parseBasicSalary + totalAllowances;

    const totalDeductions = deductions.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );

    const netTakeHomePay = totalEarnings - totalDeductions;

    const payrollData = {
      employeeId,
      periodMonth,
      basicSalary: parseBasicSalary,
      allowances: allowances.map((item) => ({
        componentName: item.componentName,
        amount: parseFloat(item.amount) || 0,
      })),
      deductions: deductions.map((item) => ({
        componentName: item.componentName,
        amount: parseFloat(item.amount) || 0,
      })),
      loanDeduction: { loanPaymentId: null, amount: 0 },
      totalEarnings,
      totalDeductions,
      netTakeHomePay,
      paymentStatus: "PENDING",
    };
    const savedPayroll = await Payroll.findOneAndUpdate({ employeeId, periodMonth }, payrollData, {
      upsert: true,
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Komponen payroll berhasil disimpan!",
      data: savedPayroll,
    });
  } catch (error) {
    console.error("Error Save Payroll:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal menyimpan data payroll: " + error.message,
    });
  }
};
