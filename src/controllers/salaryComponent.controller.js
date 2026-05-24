import * as salaryComponentService from "../services/salaryComponent.service.js";

export const renderManagePage = async (req, res) => {
  try {
    const components = await salaryComponentService.fetchAllComponents();
    
    res.render("payroll/components", {
      title: "Kelola Komponen Gaji",
      user: req.user, 
      components: components
    });
  } catch (error) {
    res.status(500).render("errors/500", { message: error.message });
  }
};

export const getAllComponents = async (req, res) => {
  try {
    const components = await salaryComponentService.fetchAllComponents();
    res.status(200).json({
      success: true,
      data: components
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};