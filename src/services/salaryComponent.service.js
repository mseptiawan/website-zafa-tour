import SalaryComponent from "../models/payroll/SalaryComponent.model.js";

export const fetchAllComponents = async () => {
  try {
    return await SalaryComponent.find({}).sort({ category: 1, code: 1 });
  } catch (error) {
    throw new Error("Gagal mengambil data komponen gaji dari database: " + error.message);
  }
};
