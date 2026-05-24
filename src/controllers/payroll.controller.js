import * as payrollService from "../services/payroll.service.js";
import Payroll from "../models/payroll/Payroll.model.js";
import EmployeeAllowance from "../models/payroll/EmployeeAllowance.model.js";
import SalaryComponent from "../models/payroll/SalaryComponent.model.js";
export const renderPayrollPage = async (req, res) => {
  try {
    const { employees, components, savedAllowances } = await payrollService.getPayrollData();

    res.render("payroll/index", {
      title: "Manajemen Payroll",
      user: req.user,
      employees,
      components,
      savedAllowances,
      currentMonth: "Juni 2026",
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
export const saveEmployeeAllowances = async (req, res) => {
  try {
    const { employeeId, allowances } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: "ID Karyawan wajib diisi." });
    }

    // 1. Ambil semua master komponen aktif untuk referensi ID dan Kategori
    const masterComponents = await SalaryComponent.find({ isActive: true });

    const componentMap = {};
    const categoryMap = {}; // Kamus pembantu untuk mencatat kategori komponen (EARNING / DEDUCTION)

    masterComponents.forEach((comp) => {
      componentMap[comp.name] = comp._id;
      categoryMap[comp._id.toString()] = comp.category;
    });

    const bulkOperations = [];
    const incomingComponentIds = [];
    const categoriesToUpdate = new Set(); // Mencatat kategori apa saja yang sedang dikirim oleh frontend

    // Jika ada data yang dikirim, susun bulk write dan catat kategorinya
    if (allowances && allowances.length > 0) {
      for (const item of allowances) {
        const componentId = componentMap[item.componentName];
        if (!componentId) continue;

        incomingComponentIds.push(componentId);

        // Masukkan kategori komponen ini (EARNING atau DEDUCTION) ke dalam Set
        const category = categoryMap[componentId.toString()];
        if (category) {
          categoriesToUpdate.add(category);
        }

        bulkOperations.push({
          updateOne: {
            filter: { employeeId, componentId },
            update: { $set: { amount: parseFloat(item.amount) || 0 } },
            upsert: true,
          },
        });
      }
    }

    // 2. PERBAIKAN BUG: Hapus data lama secara selektif berdasarkan kategori yang dikirim saja
    // Jika frontend mengirim data EARNING, hapus EARNING lama yang tidak dikirim lagi.
    // Jika frontend mengirim data DEDUCTION, hapus DEDUCTION lama yang tidak dikirim lagi.
    if (categoriesToUpdate.size > 0) {
      // Ambil semua ID master komponen yang masuk dalam kategori yang sedang di-update
      const targetComponentIds = masterComponents
        .filter((comp) => categoriesToUpdate.has(comp.category))
        .map((comp) => comp._id);

      await EmployeeAllowance.deleteMany({
        employeeId,
        componentId: {
          $in: targetComponentIds, // Harus termasuk dalam kategori yang di-update
          $nin: incomingComponentIds, // Tapi tidak ada di dalam list yang baru dikirim
        },
      });
    } else {
      // Jika frontend mengirim array kosong (HR menghapus semua baris di form), hapus seluruhnya
      await EmployeeAllowance.deleteMany({ employeeId });
    }

    // 3. Eksekusi Bulk Write jika ada data baru/perubahan
    if (bulkOperations.length > 0) {
      await EmployeeAllowance.bulkWrite(bulkOperations);
    }

    return res.status(200).json({
      success: true,
      message: "Seluruh komponen payroll berhasil diperbarui!",
    });
  } catch (error) {
    console.error("Error Save Employee Allowance:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal menyimpan komponen: " + error.message,
    });
  }
};
export const savePayroll = async (req, res) => {
  try {
    const { employeeId, periodMonth, basicSalary, allowances, deductions } = req.body;

    if (!employeeId || !periodMonth) {
      return res.status(400).json({
        success: false,
        message: "ID Karyawan dan Periode Bulan wajib diisi.",
      });
    }

    const parseBasicSalary = parseFloat(basicSalary) || 0;

    const totalAllowances = allowances.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );
    const totalEarnings = parseBasicSalary + totalAllowances;

    const totalDeductions = deductions.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );

    const netTakeHomePay = totalEarnings - totalDeductions;

    const payrollData = {
      employeeId,
      periodMonth,
      basicSalary: parseBasicSalary,
      allowances: allowances.map((item) => ({
        componentName: item.componentName,
        amount: parseFloat(item.amount) || 0,
      })),
      deductions: deductions.map((item) => ({
        componentName: item.componentName,
        amount: parseFloat(item.amount) || 0,
      })),
      loanDeduction: { loanPaymentId: null, amount: 0 },
      totalEarnings,
      totalDeductions,
      netTakeHomePay,
      paymentStatus: "PENDING",
    };
    const savedPayroll = await Payroll.findOneAndUpdate({ employeeId, periodMonth }, payrollData, {
      upsert: true,
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Komponen payroll berhasil disimpan!",
      data: savedPayroll,
    });
  } catch (error) {
    console.error("Error Save Payroll:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal menyimpan data payroll: " + error.message,
    });
  }
};
