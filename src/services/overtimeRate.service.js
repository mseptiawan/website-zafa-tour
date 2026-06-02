import SalaryComponent from "../models/payroll/SalaryComponent.model.js";

export const getOvertimeRate = async () => {
  const comp = await SalaryComponent.findOne({
    code: "TJ_LEMBUR",
    isActive: true,
  });

  return comp?.defaultAmount || 0;
};
