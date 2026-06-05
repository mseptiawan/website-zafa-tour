import Employee from "../../models/employee/Employee.model.js";
import EmployeeSalary from "../../models/employee/EmployeeSalary.model.js";
import Payroll from "../../models/payroll/Payroll.model.js";
import LoanPayment from "../../models/loan/loanPayment.model.js";

const completePayrollHistorySeeder = async () => {
  try {
    console.log("🧹 Menghapus payroll lama...");

    const deleteResult = await Payroll.deleteMany({});

    console.log(`✅ Payroll lama dihapus (${deleteResult.deletedCount} records)`);

    const employees = await Employee.find({});

    if (!employees.length) {
      console.log("❌ Tidak ada employee.");
      return;
    }

    console.log(`👥 Employee ditemukan: ${employees.length}`);

    const salaries = await EmployeeSalary.find({
      employeeId: {
        $in: employees.map((e) => e._id),
      },
    });

    const salaryMap = {};

    salaries.forEach((s) => {
      salaryMap[s.employeeId.toString()] = s;
    });

    const loanPayments = await LoanPayment.find({
      employeeId: {
        $in: employees.map((e) => e._id),
      },
    });

    const payrollRecords = [];

    const periods = [
      {
        period: "2026-03",
        konsumsi: 625000,
      },
      {
        period: "2026-04",
        konsumsi: 600000,
      },
      {
        period: "2026-05",
        konsumsi: 550000,
      },
    ];

    for (const employee of employees) {
      const salaryData = salaryMap[employee._id.toString()];

      const basicSalary = salaryData?.basicSalary || 4000000;

      const bpjs = Math.round(basicSalary * 0.03);

      for (const monthConfig of periods) {
        const loanPayment = loanPayments.find(
          (lp) =>
            lp.employeeId.toString() === employee._id.toString() &&
            lp.periodMonth === monthConfig.period
        );

        const loanAmount = loanPayment?.amount || 0;

        const allowanceKomunikasi = 150000;

        const totalEarnings = basicSalary + monthConfig.konsumsi + allowanceKomunikasi;

        const totalDeductions = bpjs + loanAmount;

        payrollRecords.push({
          employeeId: employee._id,

          periodMonth: monthConfig.period,

          basicSalary,

          allowances: [
            {
              componentName: "Tunjangan Konsumsi",
              amount: monthConfig.konsumsi,
            },
            {
              componentName: "Tunjangan Komunikasi",
              amount: allowanceKomunikasi,
            },
          ],

          deductions: [
            {
              componentName: "Potongan BPJS",
              amount: bpjs,
            },
          ],

          loanDeduction: {
            loanPaymentId: loanPayment?._id || null,
            amount: loanAmount,
          },

          totalEarnings,

          totalDeductions,

          netTakeHomePay: totalEarnings - totalDeductions,

          status: "PAID",

          paidAt: new Date(`${monthConfig.period}-28T09:00:00Z`),
        });
      }
    }

    console.log(`📦 Payroll yang akan dibuat: ${payrollRecords.length}`);

    if (payrollRecords.length > 0) {
      const inserted = await Payroll.insertMany(payrollRecords);

      console.log(`🚀 Berhasil membuat ${inserted.length} payroll`);
    }

    console.log("✅ Payroll seeding selesai.");
  } catch (error) {
    console.error("❌ Payroll seeder gagal:", error);
  }
};

export default completePayrollHistorySeeder;
