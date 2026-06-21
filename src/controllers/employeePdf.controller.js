// 1. Gunakan kurung kurawal {} untuk Named Import
import { EmployeeService } from "../services/employee.service.js";

class EmployeePdfController {
  /**
   * Menangani HTTP request untuk mengunduh laporan data karyawan format PDF.
   * @param {Object} req - Express Request Object.
   * @param {Object} res - Express Response Object.
   */
  async exportPdf(req, res) {
    try {
      // 2. Sesuaikan fungsi menjadi findAllEmployees sesuai isi service kamu
      const employees = await EmployeeService.findAllEmployees(req.session?.user);

      const pdfBuffer = await EmployeeService.generatePdf(employees);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=laporan_data_karyawan.pdf");
      res.setHeader("Content-Length", pdfBuffer.length);

      return res.end(pdfBuffer);
    } catch (error) {
      console.error("=== DETAIL ERROR EXPORT PDF ===");
      console.error(error);
      console.error("===============================");
      console.error("Gagal mengekspor PDF melalui EmployeePdfController:", error);
      return res.status(500).send("Terjadi kesalahan pada server saat membuat dokumen PDF.");
    }
  }
}

export default new EmployeePdfController();
