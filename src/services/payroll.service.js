import Employee from "../models/employee/Employee.model.js";
import Payroll from "../models/payroll/Payroll.model.js";
import EmployeeAllowance from "../models/payroll/EmployeeAllowance.model.js";
import LoanPayment from "../models/loan/loanPayment.model.js";
import SalaryComponent from "../models/payroll/SalaryComponent.model.js";

/**
 * Mengambil data master seluruh karyawan, komponen gaji, dan tunjangan tersimpan.
 */
export const getPayrollData = async () => {
  const employees = await Employee.find()
    .populate({
      path: "careerData",
      populate: {
        path: "positionId",
        model: "Position",
      },
    })
    .lean();

  const components = await SalaryComponent.find({ isActive: true }).lean();
  const savedAllowances = await EmployeeAllowance.find().populate("componentId").lean();

  return { employees, components, savedAllowances };
};

export const closePayroll = async (periodMonth) => {
  const employees = await Employee.find();

  const processedResults = [];

  for (const employee of employees) {
    const empId = employee._id;
    const basicSalary = employee?.financialData?.basicSalary || 0;

    const savedAllowances = await EmployeeAllowance.find({
      employeeId: empId,
    })
      .populate("componentId")
      .lean();

    const allowances = [];
    const deductions = [];
    let totalEarnings = basicSalary;
    let totalDeductions = 0;

    savedAllowances.forEach((item) => {
      if (!item.componentId) return;

      let finalAmount = item.amount || 0;
      let displayName = item.componentId.name.split("(")[0].trim();

      if (
        item.componentId.calculationType === "PERCENTAGE" &&
        item.componentId.basedOnComponent === "GAPOK"
      ) {
        const percentageValue = finalAmount < 100 ? finalAmount : 2;
        finalAmount = (percentageValue / 100) * basicSalary;
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

    const activeLoanPayments = await LoanPayment.find({
      employeeId: empId,
      periodMonth,
      isPaid: false,
    }).lean();

    const loanDeduction = [];
    let totalLoanDeduction = 0;

    activeLoanPayments.forEach((loan) => {
      loanDeduction.push({
        loanPaymentId: loan._id,
        amount: loan.amount,
      });

      totalLoanDeduction += loan.amount;
    });

    totalDeductions += totalLoanDeduction;

    const payroll = await Payroll.findOneAndUpdate(
      {
        employeeId: empId,
        periodMonth,
      },
      {
        employeeId: empId,
        periodMonth,
        basicSalary,
        allowances,
        deductions,
        loanDeduction,
        totalEarnings,
        totalDeductions,
        netTakeHomePay: totalEarnings - totalDeductions,
        status: "CLOSED",
        paidAt: new Date(),
        mutationFile: "/uploads/files/default-receipt.pdf",
      },
      {
        upsert: true,
        new: true,
      }
    );

    await LoanPayment.updateMany(
      {
        employeeId: empId,
        periodMonth,
        isPaid: false,
      },
      {
        $set: {
          isPaid: true,
          paidAt: new Date(),
        },
      }
    );

    processedResults.push(payroll);
  }

  return processedResults;
};
