import path from "path";
import ejs from "ejs";
import ExcelJS from "exceljs";
import { renderHtmlToPdf } from "../../utils/pdfRenderer.js";

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

export const generatePayrollExcel = async (listPayroll) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Rekap Payroll");

  worksheet.columns = [
    { header: "Nama Karyawan", key: "name", width: 25 },
    { header: "Jabatan", key: "position", width: 20 },
    { header: "Gaji Pokok", key: "basicSalary", width: 15 },
    { header: "Total Tunjangan", key: "allowances", width: 15 },
    { header: "Total Potongan", key: "deductions", width: 15 },
    { header: "Total Gaji (Net)", key: "net", width: 15 },
    { header: "Status", key: "status", width: 12 },
  ];

  listPayroll.forEach((p) => {
    worksheet.addRow({
      name: p.employeeId?.fullName || "-",
      position: p.employeeId?.position || "-",
      basicSalary: p.basicSalary || 0,
      allowances: p.totalEarnings || 0,
      deductions: p.totalDeductions || 0,
      net: p.netTakeHomePay || 0,
      status: p.status,
    });
  });

  return await workbook.xlsx.writeBuffer();
};

export const generateSingleSlipPdf = async (payrollData, employeeData) => {
  const templatePath = path.resolve("src/views/pdf/slip.ejs");

  const allowances = payrollData.allowances || [];
  const deductions = payrollData.deductions || [];

  const overtimePay = 0;

  const htmlContent = await ejs.renderFile(templatePath, {
    payroll: payrollData,
    employee: employeeData,
    overtimePay,
    allowances,
    deductions,
  });

  return await renderHtmlToPdf(htmlContent, 300);
};
