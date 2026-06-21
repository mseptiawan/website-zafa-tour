import fs from "fs";
import path from "path";
import ejs from "ejs";
import puppeteer from "puppeteer";
import Employee from "../models/employee/Employee.model.js";
import Attendance from "../models/Attendance.model.js";
import { Overtime } from "../models/Overtime.model.js";
import Payroll from "../models/payroll/Payroll.model.js";

/**
 * HELPER PRIVAT: Fungsi standar untuk menjalankan Puppeteer
 * Mencegah penulisan berulang kode launch browser & page PDF.
 */
const renderHtmlToPdf = async (htmlContent, delayMs = 350) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
};

/**
 * 1. GENERATE PDF: DATA KARYAWAN / PEGAWAI
 */
export const generateEmployeePdf = async (employeesData) => {
  const exportDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const templatePath = path.resolve("src/views/pdf/employees.ejs");

  const htmlContent = await ejs.renderFile(templatePath, {
    employees: employeesData,
    exportDate,
  });

  return await renderHtmlToPdf(htmlContent, 350);
};

/**
 * 2. GENERATE PDF: REKAP JAM LEMBUR
 */
export const generateOvertimePdf = async (listOvertime, analytics, filters) => {
  let dynamicMap = {};

  listOvertime.forEach((item) => {
    let name = item.employeeName || "Tanpa Nama";
    if (!dynamicMap[name]) {
      dynamicMap[name] = { jam: 0, kasus: 0, biaya: 0 };
    }

    if (item.status === "APPROVED") {
      dynamicMap[name].kasus++;
      dynamicMap[name].jam += item.totalHours || 0;

      let cost =
        (item.totalHours || 0) *
        (item.overtimeRateSnapshot || 0) *
        (item.multiplierSnapshot || 1.5);
      dynamicMap[name].biaya += cost;
    }
  });

  const summaryData = Object.keys(dynamicMap)
    .sort()
    .map((name) => ({
      name,
      kasus: dynamicMap[name].kasus,
      jam: dynamicMap[name].jam,
      biaya: dynamicMap[name].biaya,
    }))
    .filter((row) => row.kasus > 0);

  const exportDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const templatePath = path.resolve("src/views/pdf/overtime.ejs");

  const htmlContent = await ejs.renderFile(templatePath, {
    summaryData,
    analytics,
    filters,
    exportDate,
    period: {
      startDate: filters.startDate,
      endDate: filters.endDate,
    },
  });

  return await renderHtmlToPdf(htmlContent, 350);
};

/**
 * 4. GENERATE PDF: LAPORAN BEBAN PENGGAJIAN / PAYROLL
 */
export const generatePayrollPdf = async (listPayroll, analytics, filters) => {
  const exportDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const templatePath = path.resolve("src/views/pdf/payroll.ejs");

  const htmlContent = await ejs.renderFile(templatePath, {
    listPayroll,
    analytics,
    filters,
    exportDate,
  });

  return await renderHtmlToPdf(htmlContent, 350);
};
/**
 * 3. GENERATE PDF: LAPORAN REKAPITULASI ABSENSI
 */
export const generateAttendancePdf = async (listAttendance, analytics, filters) => {
  let dynamicSummaryMap = {};

  listAttendance.forEach((item) => {
    let name = item.fullName;
    if (!name || name === "-" || name.trim() === "") {
      if (item.userId && (item.userId.username || item.userId)) {
        name = item.userId.username || item.userId;
      } else {
        return;
      }
    }
    name = name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    if (!dynamicSummaryMap[name]) {
      dynamicSummaryMap[name] = { hadir: 0, telat: 0, menitTelat: 0, alpa: 0 };
    }

    let currentStatus = item.status ? item.status.toUpperCase() : "ALPHA";

    if (item.isMissing || currentStatus === "BELUM ABSEN" || currentStatus === "ALPHA") {
      dynamicSummaryMap[name].alpa++;
    } else if (currentStatus === "HADIR") {
      dynamicSummaryMap[name].hadir++;
    } else if (currentStatus === "TELAT") {
      dynamicSummaryMap[name].telat++;
      dynamicSummaryMap[name].menitTelat += parseInt(item.lateDuration || 0);
    }
  });

  const summaryData = Object.keys(dynamicSummaryMap)
    .sort()
    .map((name) => ({
      name,
      hadir: dynamicSummaryMap[name].hadir,
      telat: dynamicSummaryMap[name].telat,
      menitTelat: dynamicSummaryMap[name].menitTelat,
      alpa: dynamicSummaryMap[name].alpa,
    }));

  const exportDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const templatePath = path.resolve("src/views/pdf/attendance.ejs");

  const htmlContent = await ejs.renderFile(templatePath, {
    summaryData,
    analytics,
    filters,
    exportDate,
  });

  return await renderHtmlToPdf(htmlContent, 350);
};

/**
 * Service untuk mengagregasikan ringkasan dari 4 sektor laporan utama
 * @param {Object} filters - Objek berisi startDate, endDate, dan periodMonth
 * @returns {Object} Data summary gabungan 4 laporan
 */
export const getExecutiveReportSummary = async ({ startDate, endDate, periodMonth }) => {
  // 1. Data Pegawai (Total Aktif)
  const totalEmployees = await Employee.countDocuments({});

  // 2. Data Absensi (Total Log Hadir)
  const totalHadir = await Attendance.countDocuments({
    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
  });

  // 3. Data Lembur (Total Jam & Estimasi Biaya)
  const listOvertime = await Overtime.find({
    overtimeDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
    status: "APPROVED",
  }).lean();

  let totalOvertimeHours = 0;
  let totalOvertimeCost = 0;
  listOvertime.forEach((item) => {
    totalOvertimeHours += item.totalHours || 0;
    totalOvertimeCost +=
      (item.totalHours || 0) * (item.overtimeRateSnapshot || 0) * (item.multiplierSnapshot || 1.5);
  });

  // 4. Data Payroll (Total Pengeluaran Gaji Net Bersih)
  const listPayroll = await Payroll.find({
    periodMonth: periodMonth,
    status: { $in: ["CLOSED", "PAID"] },
  }).lean();

  let totalPayrollNet = 0;
  listPayroll.forEach((p) => {
    totalPayrollNet += p.netTakeHomePay || 0;
  });

  // Kembalikan data yang sudah terstruktur rapi
  return {
    employees: { total: totalEmployees },
    attendance: { totalHadir },
    overtime: { hours: totalOvertimeHours, cost: totalOvertimeCost },
    payroll: { totalNet: totalPayrollNet, count: listPayroll.length },
  };
};
