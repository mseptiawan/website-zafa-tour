import path from "path";
import ejs from "ejs";
import { renderHtmlToPdf } from "../../utils/pdfRenderer.js";
import exceljs from "exceljs";

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
      dynamicSummaryMap[name] = { hadir: 0, telat: 0, menitTelat: 0, izin: 0, cuti: 0, alpa: 0 };
    }

    let currentStatus = item.status ? item.status.toUpperCase() : "ALPHA";

    if (item.isMissing || currentStatus === "BELUM ABSEN" || currentStatus === "ALPHA") {
      dynamicSummaryMap[name].alpa++;
    } else if (currentStatus === "HADIR") {
      dynamicSummaryMap[name].hadir++;
    } else if (currentStatus === "TELAT") {
      dynamicSummaryMap[name].telat++;
      dynamicSummaryMap[name].menitTelat += parseInt(item.lateDuration || 0);
    } else if (currentStatus === "IZIN") {
      dynamicSummaryMap[name].izin++;
    } else if (currentStatus === "CUTI") {
      dynamicSummaryMap[name].cuti++;
    }
  });

  const summaryData = Object.keys(dynamicSummaryMap)
    .sort()
    .map((name) => ({
      name,
      hadir: dynamicSummaryMap[name].hadir,
      telat: dynamicSummaryMap[name].telat,
      menitTelat: dynamicSummaryMap[name].menitTelat,
      izin: dynamicSummaryMap[name].izin,
      cuti: dynamicSummaryMap[name].cuti,
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

export const generateAttendanceExcel = async (data, selectedPeriod) => {
  const isAdmin = data.isAdmin;
  const isPersonalView = data.activeView === "personal";

  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet("Rekap Absensi");

  if (isAdmin && !isPersonalView) {
    worksheet.mergeCells("A1:G1");
    worksheet.getCell("A1").value = "LAPORAN REKAPITULASI KEDISIPLINAN STAF";
  } else {
    worksheet.mergeCells("A1:E1");
    worksheet.getCell("A1").value = "LAPORAN LOG AKTIVITAS & PRESENSI HARIAN";
  }
  worksheet.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF1E293B" } };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  const subtitleCell = isAdmin && !isPersonalView ? "A2:G2" : "A2:E2";
  worksheet.mergeCells(subtitleCell);
  worksheet.getCell("A2").value = `Siklus Periode Cut Off: ${selectedPeriod}`;
  worksheet.getCell("A2").font = { italic: true, size: 11, color: { argb: "FF64748B" } };
  worksheet.getCell("A2").alignment = { horizontal: "center" };

  worksheet.addRow([]);

  if (isAdmin && !isPersonalView) {
    const headerRow = worksheet.addRow([
      "Nama Karyawan",
      "Total Hadir",
      "Frekuensi Telat",
      "Izin",
      "Cuti",
      "Alpha",
      "Durasi Keterlambatan (Menit)",
    ]);
    headerRow.font = { bold: true };

    let userReportMap = {};
    data.listAttendance.forEach((item) => {
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

      if (!userReportMap[name]) {
        userReportMap[name] = {
          hadir: 0,
          telat: 0,
          menitTelat: 0,
          izin: 0,
          cuti: 0,
          alpa: 0,
        };
      }

      let stat = item.status ? item.status.toUpperCase() : "ALPHA";
      if (item.isMissing || stat === "ALPHA" || stat === "BELUM ABSEN") userReportMap[name].alpa++;
      else if (stat === "HADIR") userReportMap[name].hadir++;
      else if (stat === "TELAT") {
        userReportMap[name].telat++;
        userReportMap[name].menitTelat += parseInt(item.lateDuration || 0);
      } else if (stat === "IZIN") userReportMap[name].izin++;
      else if (stat === "CUTI") userReportMap[name].cuti++;
    });

    const adminUsers = Object.keys(userReportMap).sort();

    if (adminUsers.length > 0) {
      adminUsers.forEach((name) => {
        let uData = userReportMap[name];
        worksheet.addRow([
          name,
          `${uData.hadir} hari`,
          `${uData.telat} kali`,
          `${uData.izin} hari`,
          `${uData.cuti} hari`,
          `${uData.alpa} hari`,
          uData.menitTelat,
        ]);
      });
    } else {
      const emptyRow = worksheet.addRow(["Tidak ada data rekap absensi karyawan pada siklus ini."]);
      worksheet.mergeCells(`A5:G5`);
      emptyRow.alignment = { horizontal: "center" };
    }

    worksheet.columns = [
      { key: "name", width: 28 },
      { key: "hadir", width: 15, style: { alignment: { horizontal: "center" } } },
      { key: "telat", width: 18, style: { alignment: { horizontal: "center" } } },
      { key: "izin", width: 15, style: { alignment: { horizontal: "center" } } },
      { key: "cuti", width: 15, style: { alignment: { horizontal: "center" } } },
      { key: "alpa", width: 15, style: { alignment: { horizontal: "center" } } },
      {
        key: "menitTelat",
        width: 25,
        style: { alignment: { horizontal: "right" }, numFmt: '#,##0" menit"' },
      },
    ];
  } else {
    const headerRow = worksheet.addRow([
      "Tanggal Berjalan",
      "Jam Masuk",
      "Jam Pulang",
      "Klasifikasi Lokasi",
      "Status Log",
    ]);
    headerRow.font = { bold: true };

    if (data.listAttendance && data.listAttendance.length > 0) {
      data.listAttendance.forEach((log) => {
        const dateObj = log.checkIn ? new Date(log.checkIn) : new Date(log.createdAt);
        const tglString = dateObj.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        const jamMasuk = log.checkIn
          ? new Date(log.checkIn).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—";
        const jamPulang = log.checkOut
          ? new Date(log.checkOut).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—";

        let statusText = "Tidak Hadir (Alpha)";
        if (log.status === "HADIR") statusText = "Tepat Waktu";
        else if (log.status === "TELAT") statusText = `Terlambat (+${log.lateDuration}m)`;
        else if (log.status === "IZIN" || log.status === "CUTI")
          statusText = log.displayStatus || log.status;

        worksheet.addRow([tglString, jamMasuk, jamPulang, log.type || "KANTOR", statusText]);
      });
    } else {
      const emptyRow = worksheet.addRow([
        "Tidak ada rekam jejak presensi pada rentang periode siklus ini.",
      ]);
      worksheet.mergeCells(`A5:E5`);
      emptyRow.alignment = { horizontal: "center" };
    }

    worksheet.columns = [
      { key: "tanggal", width: 20 },
      { key: "masuk", width: 15, style: { alignment: { horizontal: "center" } } },
      { key: "pulang", width: 15, style: { alignment: { horizontal: "center" } } },
      { key: "lokasi", width: 22, style: { alignment: { horizontal: "center" } } },
      { key: "status", width: 28, style: { alignment: { horizontal: "right" } } },
    ];
  }

  return workbook;
};
