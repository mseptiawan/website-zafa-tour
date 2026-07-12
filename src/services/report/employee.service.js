import path from "path";
import ejs from "ejs";
import ExcelJS from "exceljs";
import { renderHtmlToPdf } from "../../utils/pdfRenderer.js";

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

  return await renderHtmlToPdf(htmlContent, 400);
};

export const generateEmployeeExcel = async (employeesData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data Karyawan");

  worksheet.columns = [
    { header: "ID Karyawan", key: "employeeId", width: 18 },
    { header: "Nama Lengkap", key: "fullName", width: 28 },
    { header: "Jenis Kelamin", key: "gender", width: 15 },
    { header: "Jabatan", key: "position", width: 22 },
    { header: "Bidang / Divisi", key: "bidang", width: 22 },
    { header: "Status Pegawai", key: "statusPegawai", width: 18 },
    { header: "Masa Kerja", key: "tenure", width: 18 },
    { header: "Usia", key: "age", width: 12 },
    { header: "Pendidikan Terakhir", key: "edu", width: 20 },
    { header: "Jurusan", key: "major", width: 22 },
    { header: "Status Pernikahan", key: "marriage", width: 18 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" }, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1E293B" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  employeesData.forEach((emp) => {
    const career = emp.careerData && emp.careerData.length > 0 ? emp.careerData[0] : null;
    const edu = emp.educationData || null;

    let usiaStr = "—";
    if (emp.tanggal_lahir) {
      const diffAge = Date.now() - new Date(emp.tanggal_lahir).getTime();
      usiaStr = Math.floor(diffAge / (1000 * 60 * 60 * 24 * 365.25)) + " Tahun";
    }

    let masaKerjaStr = "—";
    if (career && career.tanggal_mulai_bergabung) {
      const diffJoin = Date.now() - new Date(career.tanggal_mulai_bergabung).getTime();
      const totalMonths = Math.floor(diffJoin / (1000 * 60 * 60 * 24 * 30.4375));
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      masaKerjaStr = years > 0 ? `${years} Thn ${months} Bln` : `${months} Bln`;
    }

    worksheet.addRow({
      employeeId: emp.employeeIdNumber,
      fullName: emp.fullName,
      gender: emp.jenis_kelamin,
      position:
        career && career.positionId ? career.positionId.name || career.positionId.nama : "—",
      bidang: career && career.bidangId ? career.bidangId.name || career.bidangId.nama : "—",
      statusPegawai: career ? career.status_pegawai : "—",
      tenure: masaKerjaStr,
      age: usiaStr,
      edu: edu ? edu.pendidikan_terakhir : "—",
      major: edu && edu.jurusan ? edu.jurusan : "—",
      marriage: emp.status_pernikahan || "—",
    });
  });

  worksheet.eachRow({ includeLines: false }, function (row, rowNumber) {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "E2E8F0" } },
          bottom: { style: "thin", color: { argb: "E2E8F0" } },
          left: { style: "thin", color: { argb: "E2E8F0" } },
          right: { style: "thin", color: { argb: "E2E8F0" } },
        };
        cell.alignment = { vertical: "middle" };
      });
    }
  });

  return await workbook.xlsx.writeBuffer();
};
