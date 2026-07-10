import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import * as payrollService from "../services/payroll.service.js";
import { getAttendanceSummary } from "../services/attendance.service.js";
import { getOvertimeSummary } from "../services/overtime.service.js";
import { getPayrollPeriod, generatePayrollPeriods } from "../utils/payrollPeriod.js";
import Employee from "../models/employee/Employee.model.js";
import Payroll from "../models/payroll/Payroll.model.js";
import SalaryComponent from "../models/payroll/SalaryComponent.model.js";
import EmployeeAllowance from "../models/payroll/EmployeeAllowance.model.js";
import LoanPayment from "../models/loan/loanPayment.model.js";

/**
 * Menampilkan halaman utama manajemen lembar kerja payroll perusahaan.
 */
export const renderPayrollPage = asyncHandler(async (req, res) => {
  const periodParam = req.query.period;

  if (!periodParam) {
    const kini = new Date();
    const defaultPeriod = `${kini.getFullYear()}-${String(kini.getMonth() + 1).padStart(2, "0")}`;
    return res.redirect(`/payroll/process?period=${defaultPeriod}`);
  }

  const { employees, components, savedAllowances } = await payrollService.getPayrollData();

  const dropdownComponents = components.filter(
    (comp) => comp.sourceType !== "DYNAMIC" && comp.isLocked !== true
  );

  const [year, month] = periodParam.split("-");
  const targetDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 2, 15, 0, 0, 0));

  const currentPeriod = getPayrollPeriod(targetDate);
  const periodsFromDB = await Payroll.distinct("periodMonth");

  const availablePeriods = [...new Set([...generatePayrollPeriods(6, 3), ...periodsFromDB])].sort(
    (a, b) => b.localeCompare(a)
  );

  res.render("payroll/index", {
    ...buildRenderData(req, {
      title: "Manajemen Payroll",
      user: req.session.user,
      employees,
      components,
      dropdownComponents,
      savedAllowances,
      availablePeriods,
      currentPeriod: periodParam || currentPeriod.id,
    }),
  });
});
/**
 * Menghitung estimasi kalkulasi nominal gaji bulanan karyawan (Draf/AJAX).
 */
export const calculatePayroll = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const period = req.query.period;

  const existingPayroll = await Payroll.findOne({
    employeeId,
    periodMonth: period,
  }).lean();

  if (existingPayroll) {
    return res.json({
      isHistory: existingPayroll.status === "CLOSED",
      data: existingPayroll,
    });
  }

  const employee = await Employee.findById(employeeId).lean();
  const basicSalary = employee?.financialData?.basicSalary || 0;

  // Pastikan pencarian pinjaman menggunakan string periode yang divalidasi
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

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    return res.status(400).json({
      success: false,
      message: "Format ID pegawai tidak valid.",
    });
  }

  let targetDate = new Date();

  if (periodParam) {
    const [year, month] = periodParam.split("-");
    targetDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 2, 15, 0, 0, 0));
  }

  const summary = await getAttendanceSummary(employeeId, targetDate);

  return res.status(200).json({
    success: true,
    totalDays: summary?.totalDaysPresent || 0,
    periodInfo: summary?.period || null,
  });
});

/**
 * Mengambil rekapitulasi lembur bulanan karyawan.
 */
export const getEmployeeOvertimeSummary = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const periodParam = req.query.period;

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    return res.status(400).json({ success: false, message: "Format ID pegawai tidak valid." });
  }

  let targetDate = new Date();

  if (periodParam) {
    const [year, month] = periodParam.split("-");
    targetDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 2, 15, 0, 0, 0));
  }

  const summary = await getOvertimeSummary(employeeId, targetDate);

  return res.status(200).json({
    success: true,
    totalHours: summary?.totalHours || 0,
    totalPay: summary?.totalPay || 0,
    period: summary?.period || null,
  });
});

/**
 * Melakukan proses finalisasi (Tutup Buku) penggajian karyawan secara kolektif per periode.
 */
export const closePayrollForEmployees = asyncHandler(async (req, res) => {
  const { periodMonth } = req.body;

  const processedResults = await payrollService.closePayroll(periodMonth);

  return res.status(200).json({
    success: true,
    message: `Proses tutup buku payroll periode ${periodMonth} berhasil.`,
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
    status: { $in: ["CLOSED"] },
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
