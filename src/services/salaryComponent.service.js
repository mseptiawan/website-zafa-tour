import SalaryComponent from "../models/payroll/SalaryComponent.model.js";

export const fetchAllComponents = async () => {
  try {
    return await SalaryComponent.find({}).sort({ category: 1, code: 1 });
  } catch (error) {
    throw new Error("Gagal mengambil data komponen gaji dari database: " + error.message);
  }
};

export const createComponent = async (data) => {
  return await SalaryComponent.create({
    code: data.code,
    name: data.name,
    category: data.category,
    type: data.type,
    calculationType: data.calculationType || "FIXED_AMOUNT",
    defaultAmount: data.defaultAmount || 0,
    isActive: true,
  });
};

export const updateComponent = async (id, data) => {
  return await SalaryComponent.findByIdAndUpdate(
    id,
    {
      name: data.name,
      category: data.category,
      type: data.type,
      calculationType: data.calculationType,
      defaultAmount: data.defaultAmount,
    },
    { new: true }
  );
};

export const archiveComponent = async (id) => {
  try {
    return await SalaryComponent.findByIdAndUpdate(
      id,
      { isActive: false },
      { returnDocument: "after" }
    );
  } catch (error) {
    throw new Error("Gagal mengarsipkan komponen gaji: " + error.message);
  }
};
