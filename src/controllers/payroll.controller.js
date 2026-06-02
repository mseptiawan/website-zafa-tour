import * as payrollService from "../services/payroll.service.js";
import Payroll from "../models/payroll/Payroll.model.js";
import { runPayroll } from "../services/payrollRun.service.js";
import { getOvertimeSummary } from "../services/overtimeSummary.service.js";

export const renderPayrollPage = async (req, res) => {
  try {
    const { employees, components, savedAllowances } = await payrollService.getPayrollData();

    const now = new Date();

    const currentMonth = now.toLocaleString("id-ID", {
      month: "long",
      year: "numeric",
    });

    const payrollPeriod = {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };

    res.render("payroll/index", {
      title: "Manajemen Payroll",
      user: req.user,
      employees,
      components,
      savedAllowances,
      currentMonth,
      payrollPeriod,
    });
  } catch (error) {
    res.status(500).send(error.message);
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

    const period = new Date(date || Date.now());

    // ambil overtime dari engine
    const overtime = await getOvertimeSummary(employeeId, period);

    // ambil payroll base data (allowance + deduction + salary)
    const payrollData = await payrollService.buildPayroll({
      employeeId,
      date: period,
      overtime,
    });

    const saved = await Payroll.findOneAndUpdate(
      {
        employeeId,
        periodMonth: `${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, "0")}`,
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
