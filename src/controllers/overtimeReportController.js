import puppeteer from "puppeteer";
import { getOvertimeReportData } from "../services/overtimeReportService.js";
import exceljs from "exceljs";
export const getReportPage = async (req, res) => {
  try {
    const result = await getOvertimeReportData(req.query);

    res.render("overtime/report", {
      title: "Laporan Lembur",
      data: result.data,
      summary: result.summary,
      pagination: result.pagination,
      query: req.query,
    });
  } catch (err) {
    console.log(err);
    res.send("Error loading report");
  }
};

import ExcelJS from "exceljs";
import Overtime from "../models/Overtime.js";
export const exportExcel = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const data = await Overtime.find(filter).sort({ date: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Laporan Lembur");

    sheet.columns = [
      { header: "Karyawan", key: "employeeName", width: 25 },
      { header: "Tanggal", key: "date", width: 15 },
      { header: "Jam", key: "time", width: 25 },
      { header: "Total", key: "totalHours", width: 10 },
      { header: "Status", key: "status", width: 15 },
    ];

    data.forEach((o) => {
      sheet.addRow({
        employeeName: o.employeeName,
        date: new Date(o.date).toLocaleDateString("id-ID"),
        time: `${o.startTime} - ${o.endTime}`,
        totalHours: `${o.totalHours} jam`,
        status: o.status,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader("Content-Disposition", "attachment; filename=laporan-lembur.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).send(err.message);
  }
};
export const exportPDF = async (req, res) => {
  try {
    const data = await Overtime.find();

    const html = `
      <h2>Laporan Lembur</h2>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <th>Karyawan</th>
          <th>Tanggal</th>
          <th>Jam</th>
          <th>Total</th>
          <th>Status</th>
        </tr>

        ${data
          .map(
            (o) => `
          <tr>
            <td>${o.employeeName}</td>
            <td>${new Date(o.date).toLocaleDateString("id-ID")}</td>
            <td>${o.startTime} - ${o.endTime}</td>
            <td>${o.totalHours}</td>
            <td>${o.status}</td>
          </tr>
        `
          )
          .join("")}
      </table>
    `;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(html);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=laporan-lembur.pdf");

    res.send(pdf);
  } catch (err) {
    console.log(err);
    res.send("Error export PDF");
  }
};
