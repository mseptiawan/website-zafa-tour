import * as salaryComponentService from "../services/salaryComponent.service.js";

export const renderManagePage = async (req, res) => {
  try {
    const components = await salaryComponentService.fetchAllComponents();

    res.render("payroll/component", {
      title: "Kelola Komponen Gaji",
      user: req.user,
      components: components,
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
      data: components,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createComponent = async (req, res) => {
  try {
    const component = await salaryComponentService.createComponent(req.body);

    res.status(201).json({
      success: true,
      data: component,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateComponent = async (req, res) => {
  try {
    const component = await salaryComponentService.updateComponent(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: component,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const restoreComponent = async (req, res) => {
  try {
    const { id } = req.params;
    await salaryComponentService.updateComponentStatus(id, true);

    res.json({ success: true, message: "Komponen berhasil diaktifkan kembali!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const archiveComponent = async (req, res) => {
  try {
    const id = req.params.id;

    const component = await salaryComponentService.archiveComponent(id);

    if (!component) {
      return res.status(404).json({ success: false, message: "Komponen tidak ditemukan" });
    }

    res.status(200).json({
      success: true,
      message: "Komponen berhasil diarsipkan",
      data: component,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
