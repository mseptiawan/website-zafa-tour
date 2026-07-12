import Employee from "../../models/employee/Employee.model.js";
import {
  generateEmployeePdf,
  generateEmployeeExcel,
} from "../../services/report/employee.service.js";

export const getEmployeeReport = async (req, res) => {
  try {
    const employees = await Employee.find({}).populate({
      path: "careerData",
      populate: [
        { path: "bidangId", model: "Bidang" },
        { path: "positionId", model: "Position" },
      ],
    });

    res.render("report/employee", {
      title: "Laporan Data Pegawai",
      employees,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Eror menarik laporan pegawai");
  }
};

export const downloadEmployeePdfReport = async (req, res) => {
  try {
    const employees = await Employee.find({}).populate({
      path: "careerData",
      populate: [
        { path: "bidangId", model: "Bidang" },
        { path: "positionId", model: "Position" },
      ],
    });

    const pdfBuffer = await generateEmployeePdf(employees);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Laporan_Data_Karyawan_ZafaTour.pdf");
    return res.end(pdfBuffer);
  } catch (error) {
    console.error("Gagal mengekspor PDF melalui ReportController:", error);
    return res.status(500).send("Gagal mengunduh laporan PDF data karyawan.");
  }
};

export const downloadEmployeeExcelReport = async (req, res) => {
  try {
    const employees = await Employee.find({}).populate({
      path: "careerData",
      populate: [
        { path: "bidangId", model: "Bidang" },
        { path: "positionId", model: "Position" },
      ],
    });

    const excelBuffer = await generateEmployeeExcel(employees);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Laporan_Data_Karyawan_ZafaTour.xlsx"
    );
    return res.end(excelBuffer);
  } catch (error) {
    console.error("Gagal mengekspor Excel melalui ReportController:", error);
    return res.status(500).send("Gagal mengunduh laporan Excel data karyawan.");
  }
};
