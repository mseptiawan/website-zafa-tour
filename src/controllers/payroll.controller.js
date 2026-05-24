import * as payrollService from "../services/payroll.service.js";

export const renderPayrollPage = async (req, res) => {
  try {
    const { employees, components } = await payrollService.getPayrollData();

    res.render("payroll/index", {
      title: "Manajemen Payroll",
      user: req.user,
      employees,
      components,
      currentMonth: "Juni 2026",
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export const savePayroll = async (req, res) => {
  try {
    const payroll = await payrollService.savePayrollRecord(req.body);
    res.status(200).json({ success: true, data: payroll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
