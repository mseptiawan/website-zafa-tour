import Employee from "../models/employee/Employee.model.js";
import { getAttendanceSummary } from "../services/attendanceSummary.service.js";
import * as payrollService from "../services/payroll.service.js";
import Payroll from "../models/payroll/Payroll.model.js";
import { runPayroll } from "../services/payrollRun.service.js";
import { getOvertimeSummary } from "../services/overtimeSummary.service.js";
import SalaryComponent from "../models/payroll/SalaryComponent.model.js";
import EmployeeAllowance from "../models/payroll/EmployeeAllowance.model.js";
import EmployeeSalary from "../models/employee/EmployeeSalary.model.js";
import LoanPayment from "../models/loan/loanPayment.model.js";

export const renderPayrollPage = async (req, res) => {
  try {
    const { employees, components, savedAllowances } = await payrollService.getPayrollData();

    const dropdownComponents = components.filter(
      (comp) => comp.sourceType !== "DYNAMIC" && comp.isLocked !== true
    );

    const now = new Date();
    const currentMonthRaw = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const periodsFromDB = await Payroll.distinct("periodMonth");
    const periodsSet = new Set(periodsFromDB);
    periodsSet.add(currentMonthRaw);

    const availablePeriods = Array.from(periodsSet).sort((a, b) => b.localeCompare(a));

    res.render("payroll/index", {
      title: "Manajemen Payroll",
      user: req.user,
      employees,
      components,
      dropdownComponents,
      savedAllowances,
      availablePeriods,
      currentPeriod: currentMonthRaw,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export const calculateEmployeePayroll = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const period = req.query.period; // Contoh nilai: "2026-05"

    // 1. Dapatkan format string bulan berjalan saat ini (Contoh: "2026-06")
    const now = new Date();
    const currentMonthRaw = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // 2. Cek apakah periode yang di-request adalah masa lalu
    // Perbandingan string "2026-05" < "2026-06" akan menghasilkan TRUE
    const isPastPeriod = period < currentMonthRaw;

    // 3. Cek data slip gaji yang sudah tersimpan di database
    const existingPayroll = await Payroll.findOne({ employeeId, periodMonth: period });

    // KONDISI A: Slip gaji masa lalu (atau bulan ini) sudah pernah di-generate & disimpan
    if (existingPayroll) {
      return res.json({
        isHistory: true, // Kunci UI
        data: existingPayroll,
      });
    }

    // KONDISI B: Tidak ada data slip gaji, TAPI yang dipilih adalah bulan MASA LALU
    if (isPastPeriod) {
      return res.json({
        isHistory: true, // Paksa Kunci UI!
        data: {
          basicSalary: 0,
          allowances: [],
          deductions: [],
          loanDeduction: null,
          overtime: { hours: 0, amount: 0 },
        },
      });
    }

    // KONDISI C: MODE INPUT AKTIF (Bulan Berjalan & Belum Ada Slip Gaji Tersimpan)
    const salaryDoc = await EmployeeSalary.findOne({ employeeId });
    const basicSalary = salaryDoc ? salaryDoc.basicSalary : 0;

    const activeLoanPayment = await LoanPayment.findOne({
      employeeId,
      periodMonth: period,
      isPaid: false,
    });

    return res.json({
      isHistory: false, // Buka Kunci UI, tampilkan tombol Simpan
      data: {
        basicSalary,
        loanDeduction: activeLoanPayment
          ? { loanPaymentId: activeLoanPayment._id, amount: activeLoanPayment.amount }
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const savePayroll = async (req, res) => {
  try {
    const { employeeId, date } = req.body;
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee wajib dipilih",
      });
    }

    const periodDate = new Date(date || Date.now());
    const period = getPayrollPeriod(periodDate);
    const overtime = await getOvertimeSummary(employeeId, periodDate);
    const payrollData = await payrollService.buildPayroll({
      employeeId,
      date: periodDate,
      overtime,
    });

    const saved = await Payroll.findOneAndUpdate(
      {
        employeeId,
        periodMonth: period.id,
      },
      payrollData,
      { upsert: true, new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: "Payroll berhasil dihitung",
      data: saved,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const saveEmployeeAllowances = async (req, res) => {
  try {
    const { employeeId, allowances } = req.body;
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "ID Pegawai wajib diisi.",
      });
    }

    const masterComponents = await SalaryComponent.find({ isActive: true });
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
            update: {
              $set: {
                amount: parseFloat(item.amount) || 0,
              },
            },
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
        componentId: {
          $in: targetComponentIds,
          $nin: incomingComponentIds,
        },
      });
    } else {
      await EmployeeAllowance.deleteMany({ employeeId });
    }

    if (bulkOperations.length > 0) {
      await EmployeeAllowance.bulkWrite(bulkOperations);
    }

    return res.status(200).json({
      success: true,
      message: "Seluruh komponen payroll berhasil diperbarui!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getEmployeeAttendanceSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const periodParam = req.query.period;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Pegawai tidak ditemukan" });
    }

    const targetDate = periodParam ? new Date(`${periodParam}-01`) : new Date();

    const summary = await getAttendanceSummary(employee.userId, targetDate);

    return res.status(200).json({
      success: true,
      totalDays: summary.totalDaysPresent,
      periodInfo: summary.period,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const closePayrollForSpecificEmployees = async (req, res) => {
  try {
    const { employeeIds, periodMonth } = req.body;

    if (!employeeIds || employeeIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Tidak ada ID pegawai yang terpilih." });
    }

    const processedResults = [];

    for (const empId of employeeIds) {
      // 1. Dapatkan besaran Gaji Pokok
      const salaryDoc = await EmployeeSalary.findOne({ employeeId: empId });
      const basicSalary = salaryDoc ? salaryDoc.basicSalary : 0;

      // 2. Ambil snapshot tunjangan dinamis dari tabel EmployeeAllowance
      const savedAllowances = await EmployeeAllowance.find({ employeeId: empId }).populate(
        "componentId"
      );

      const allowances = [];
      const deductions = [];
      let totalEarnings = basicSalary;
      let totalDeductions = 0;

      // =========================================================================
      // REVISI LOGIKA AMAN: Hitung nilai final murni berdasarkan skema master DB
      // =========================================================================
      // 2. Ambil snapshot tunjangan dinamis dari tabel EmployeeAllowance
      // 2. Ambil snapshot tunjangan dinamis dari tabel EmployeeAllowance
      savedAllowances.forEach((item) => {
        if (!item.componentId) return;

        let finalAmount = item.amount || 0;
        let displayName = item.componentId.name;

        // Bersihkan nama dari sisa-sisa string persen bawaan UI jika ada
        displayName = displayName.split("(")[0].trim();

        if (
          item.componentId.calculationType === "PERCENTAGE" &&
          item.componentId.basedOnComponent === "GAPOK"
        ) {
          // Ambil nilai persen asli (Jika di DB terlanjur besar karena bug lama, paksa set ke 2)
          const percentageValue = finalAmount < 100 ? finalAmount : 2;

          // Hitung nilai rupiah dari Gaji Pokok (2 / 100 * 4.000.000 = 80.000)
          finalAmount = (percentageValue / 100) * basicSalary;

          // Gabungkan nama komponen dengan teks persen baru
          displayName = `${displayName} (${percentageValue}%)`;
        }

        const componentData = {
          componentName: displayName,
          amount: finalAmount,
        };

        if (item.componentId.category === "EARNING") {
          allowances.push(componentData);
          totalEarnings += finalAmount;
        } else if (item.componentId.category === "DEDUCTION") {
          deductions.push(componentData);
          totalDeductions += finalAmount;
        }
      });
      // 3. Tarik potongan cicilan pinjaman aktif bulan berjalan (jika ada)
      const activeLoanPayment = await LoanPayment.findOne({
        employeeId: empId,
        periodMonth: periodMonth,
        isPaid: false,
      });

      let loanDeductionData = { loanPaymentId: null, amount: 0 };
      if (activeLoanPayment) {
        loanDeductionData = {
          loanPaymentId: activeLoanPayment._id,
          amount: activeLoanPayment.amount,
        };
        totalDeductions += activeLoanPayment.amount;
      }

      // 4. Update data atau buat baru (Upsert) ke koleksi Payroll dengan status CLOSED
      const finalPayroll = await Payroll.findOneAndUpdate(
        { employeeId: empId, periodMonth: periodMonth },
        {
          employeeId: empId,
          periodMonth: periodMonth,
          basicSalary,
          allowances,
          deductions,
          loanDeduction: loanDeductionData,
          totalEarnings,
          totalDeductions,
          netTakeHomePay: totalEarnings - totalDeductions,
          status: "CLOSED",
        },
        { upsert: true, new: true }
      );

      // 5. Ubah status pembayaran cicilan menjadi lunas
      if (activeLoanPayment) {
        await LoanPayment.findByIdAndUpdate(activeLoanPayment._id, {
          $set: {
            isPaid: true,
            paidAt: new Date(),
          },
        });
      }

      processedResults.push(finalPayroll);
    }

    return res.status(200).json({
      success: true,
      message: `Tutup buku periode ${periodMonth} berhasil diproses untuk target pegawai.`,
      data: processedResults,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
