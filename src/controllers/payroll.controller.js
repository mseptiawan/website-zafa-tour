import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import * as payrollService from "../services/payroll.service.js";
import { getAttendanceSummary } from "../services/attendanceSummary.service.js";
import { getOvertimeSummary } from "../services/overtimeSummary.service.js";
import { getPayrollPeriod } from "../utils/payrollPeriod.js";
import Employee from "../models/employee/Employee.model.js";
import Payroll from "../models/payroll/Payroll.model.js";
import SalaryComponent from "../models/payroll/SalaryComponent.model.js";
import EmployeeAllowance from "../models/payroll/EmployeeAllowance.model.js";
import LoanPayment from "../models/loan/loanPayment.model.js";

/**
 * Menampilkan halaman utama manajemen lembar kerja payroll perusahaan.
 */
export const renderPayrollPage = asyncHandler(async (req, res) => {
  const { employees, components, savedAllowances } = await payrollService.getPayrollData();

  const dropdownComponents = components.filter(
    (comp) => comp.sourceType !== "DYNAMIC" && comp.isLocked !== true
  );

  const now = new Date();
  const currentMonthRaw = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const periodsFromDB = await Payroll.distinct("periodMonth");
  const periodsSet = new Set(periodsFromDB);
  periodsSet.add(currentMonthRaw);

  const availablePeriods = Array.from(periodsSet).sort((a, b) => b.localeCompare(a));

  res.render("payroll/index", {
    ...buildRenderData(req, {
      title: "Manajemen Payroll",
      user: req.session.user,
      employees,
      components,
      dropdownComponents,
      savedAllowances,
      availablePeriods,
      currentPeriod: currentMonthRaw,
    }),
  });
});

/**
 * Menghitung estimasi kalkulasi nominal gaji bulanan karyawan (Draf/AJAX).
 */
export const calculatePayroll = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const period = req.query.period;

  const now = new Date();
  const currentMonthRaw = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const isPastPeriod = period < currentMonthRaw;

  const existingPayroll = await Payroll.findOne({ employeeId, periodMonth: period }).lean();

  if (existingPayroll) {
    return res.json({ isHistory: true, data: existingPayroll });
  }

  if (isPastPeriod) {
    return res.json({
      isHistory: true,
      data: {
        basicSalary: 0,
        allowances: [],
        deductions: [],
        loanDeduction: null,
        overtime: { hours: 0, amount: 0 },
      },
    });
  }

  const employee = await Employee.findById(employeeId).lean();
  const basicSalary = employee?.financialData?.basicSalary || 0;

  const activeLoanPayments = await LoanPayment.find({
    employeeId,
    periodMonth: period,
    isPaid: false,
  }).lean();

  return res.json({
    isHistory: false,
    data: {
      basicSalary,
      loanDeduction: activeLoanPayments.map((l) => ({
        loanPaymentId: l._id,
        amount: l.amount,
      })),
    },
  });
});

/**
 * Memproses penyimpanan draf payroll bulanan karyawan.
 */
export const savePayroll = asyncHandler(async (req, res) => {
  const { employeeId, date } = req.body;
  if (!employeeId) {
    return res.status(400).json({ success: false, message: "Karyawan wajib dipilih." });
  }

  const periodDate = new Date(date || Date.now());
  const period = getPayrollPeriod(periodDate);
  const overtime = await getOvertimeSummary(employeeId, periodDate);

  const payrollData = await payrollService.buildPayroll({
    employeeId,
    date: periodDate,
    overtime,
  });

  const saved = await Payroll.findOneAndUpdate(
    { employeeId, periodMonth: period.id },
    payrollData,
    { upsert: true, new: true, runValidators: true }
  );

  return res.json({
    success: true,
    message: "Payroll bulanan berhasil dihitung & disimpan sebagai draf.",
    data: saved,
  });
});

/**
 * Memperbarui atau menyimpan alokasi komponen tunjangan variabel mandiri milik karyawan.
 */
export const saveEmployeeAllowances = asyncHandler(async (req, res) => {
  const { employeeId, allowances } = req.body;
  if (!employeeId) {
    return res.status(400).json({ success: false, message: "ID Karyawan wajib diisi." });
  }

  const masterComponents = await SalaryComponent.find({ isActive: true }).lean();
  const componentMap = {};
  const categoryMap = {};

  masterComponents.forEach((comp) => {
    componentMap[comp.name] = comp._id;
    categoryMap[comp._id.toString()] = comp.category;
  });

  const bulkOperations = [];
  const incomingComponentIds = [];
  const categoriesToUpdate = new Set();

  if (allowances && allowances.length > 0) {
    for (const item of allowances) {
      const componentId = componentMap[item.componentName];
      if (!componentId) continue;

      incomingComponentIds.push(componentId);
      const category = categoryMap[componentId.toString()];
      if (category) categoriesToUpdate.add(category);

      bulkOperations.push({
        updateOne: {
          filter: { employeeId, componentId },
          update: { $set: { amount: parseFloat(item.amount) || 0 } },
          upsert: true,
        },
      });
    }
  }

  if (categoriesToUpdate.size > 0) {
    const targetComponentIds = masterComponents
      .filter((c) => categoriesToUpdate.has(c.category))
      .map((c) => c._id);

    await EmployeeAllowance.deleteMany({
      employeeId,
      componentId: { $in: targetComponentIds, $nin: incomingComponentIds },
    });
  } else {
    await EmployeeAllowance.deleteMany({ employeeId });
  }

  if (bulkOperations.length > 0) {
    await EmployeeAllowance.bulkWrite(bulkOperations);
  }

  return res.status(200).json({
    success: true,
    message: "Seluruh komponen tunjangan payroll karyawan berhasil diperbarui!",
  });
});

/**
 * Mengambil ringkasan rekapitulasi kehadiran bulanan karyawan untuk validasi payroll.
 */
export const getEmployeeAttendanceSummary = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const periodParam = req.query.period;

  const employee = await Employee.findById(employeeId).lean();
  if (!employee) {
    return res.status(404).json({ success: false, message: "Pegawai tidak ditemukan." });
  }

  const targetDate = periodParam ? new Date(`${periodParam}-01`) : new Date();
  const summary = await getAttendanceSummary(employee.userId, targetDate);

  return res.status(200).json({
    success: true,
    totalDays: summary.totalDaysPresent,
    periodInfo: summary.period,
  });
});

/**
 * Melakukan proses finalisasi (Tutup Buku) penggajian karyawan secara kolektif per periode.
 */
export const closePayrollForEmployees = asyncHandler(async (req, res) => {
  const { employeeIds, periodMonth } = req.body;

  if (!employeeIds || employeeIds.length === 0) {
    return res.status(400).json({ success: false, message: "Tidak ada ID pegawai yang terpilih." });
  }

  const processedResults = [];

  for (const empId of employeeIds) {
    const employee = await Employee.findById(empId).lean();
    const basicSalary = employee?.financialData?.basicSalary || 0;

    const savedAllowances = await EmployeeAllowance.find({ employeeId: empId })
      .populate("componentId")
      .lean();

    const allowances = [];
    const deductions = [];
    let totalEarnings = basicSalary;
    let totalDeductions = 0;

    savedAllowances.forEach((item) => {
      if (!item.componentId) return;

      let finalAmount = item.amount || 0;
      let displayName = item.componentId.name.split("(")[0].trim();

      if (
        item.componentId.calculationType === "PERCENTAGE" &&
        item.componentId.basedOnComponent === "GAPOK"
      ) {
        const percentageValue = finalAmount < 100 ? finalAmount : 2;
        finalAmount = (percentageValue / 100) * basicSalary;
        displayName = `${displayName} (${percentageValue}%)`;
      }

      const componentData = { componentName: displayName, amount: finalAmount };

      if (item.componentId.category === "EARNING") {
        allowances.push(componentData);
        totalEarnings += finalAmount;
      } else if (item.componentId.category === "DEDUCTION") {
        deductions.push(componentData);
        totalDeductions += finalAmount;
      }
    });

    const activeLoanPayments = await LoanPayment.find({
      employeeId: empId,
      periodMonth: periodMonth,
      isPaid: false,
    }).lean();

    let loanDeductionData = [];
    let totalLoanDeduction = 0;

    activeLoanPayments.forEach((loan) => {
      loanDeductionData.push({ loanPaymentId: loan._id, amount: loan.amount });
      totalLoanDeduction += loan.amount;
    });

    totalDeductions += totalLoanDeduction;

    const finalPayroll = await Payroll.findOneAndUpdate(
      { employeeId: empId, periodMonth: periodMonth },
      {
        employeeId: empId,
        periodMonth: periodMonth,
        basicSalary,
        allowances,
        deductions,
        loanDeduction: loanDeductionData,
        totalEarnings,
        totalDeductions,
        netTakeHomePay: totalEarnings - totalDeductions,
        status: "CLOSED",
      },
      { upsert: true, new: true }
    );

    // Otomatis mengubah status tagihan pinjaman karyawan menjadi lunas terpotong payroll
    await LoanPayment.updateMany(
      { employeeId: empId, periodMonth: periodMonth, isPaid: false },
      { $set: { isPaid: true, paidAt: new Date() } }
    );

    processedResults.push(finalPayroll);
  }

  return res.status(200).json({
    success: true,
    message: `Proses tutup buku payroll periode ${periodMonth} berhasil dieksekusi secara masal!`,
    data: processedResults,
  });
});

/**
 * Menampilkan rincian halaman slip gaji mandiri milik akun karyawan login.
 */
export const renderMySlipPage = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ userId: req.session.user._id })
    .populate({
      path: "careerData",
      populate: { path: "bidangId unitId positionId", select: "name" },
    })
    .lean();

  if (!employee) {
    return res.status(404).render("errors/404", {
      ...buildRenderData(req, {
        title: "Karyawan Tidak Ditemukan",
        message: "Profil data kepegawaian Anda belum didaftarkan pada core system.",
      }),
    });
  }

  const payrolls = await Payroll.find({
    employeeId: employee._id,
    status: { $in: ["CLOSED", "PAID"] },
  })
    .sort({ periodMonth: -1 })
    .lean();

  return res.render("payroll/my-slip", {
    ...buildRenderData(req, {
      title: "Slip Gaji Saya",
      employee,
      payrolls,
      user: req.session.user,
    }),
  });
});
