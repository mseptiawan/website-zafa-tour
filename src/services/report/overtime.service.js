import path from "path";
import ejs from "ejs";
import ExcelJS from "exceljs";
import { renderHtmlToPdf } from "../../utils/pdfRenderer.js";

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

export const generateOvertimeExcel = async (listOvertime) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Rekap Lembur");

  worksheet.columns = [
    { header: "Nama Karyawan", key: "employeeName", width: 25 },
    { header: "Tanggal", key: "date", width: 15 },
    { header: "Jam Mulai", key: "startTime", width: 12 },
    { header: "Jam Selesai", key: "endTime", width: 12 },
    { header: "Durasi (Jam)", key: "totalHours", width: 12 },
    { header: "Deskripsi Kerja", key: "workDescription", width: 40 },
    { header: "Status", key: "status", width: 15 },
    { header: "Estimasi Biaya", key: "cost", width: 15 },
  ];

  listOvertime.forEach((ot) => {
    const cost =
      (ot.totalHours || 0) * (ot.overtimeRateSnapshot || 0) * (ot.multiplierSnapshot || 1.5);
    worksheet.addRow({
      employeeName: ot.employeeName,
      date: new Date(ot.date).toLocaleDateString("id-ID"),
      startTime: ot.startTime,
      endTime: ot.endTime,
      totalHours: ot.totalHours,
      workDescription: ot.workDescription,
      status: ot.status,
      cost: cost,
    });
  });

  return await workbook.xlsx.writeBuffer();
};
