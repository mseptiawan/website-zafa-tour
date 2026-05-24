import * as salaryComponentService from "../services/salaryComponent.service.js";

export const renderManagePage = async (req, res) => {
  try {
    const components = await salaryComponentService.fetchAllComponents();

    res.render("payroll/components", {
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
export const archiveComponent = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("DEBUG - Tipe ID:", typeof id);
    console.log("DEBUG - Value ID:", id);
    console.log("DEBUG - Panjang ID:", id ? id.length : 0);

    const component = await salaryComponentService.archiveComponent(req.params.id);

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

async function restoreComponent(id) {
  if (!confirm("Apakah Anda yakin ingin mengaktifkan kembali komponen ini?")) return;

  try {
    const response = await fetch(`/api/components/restore/${id}`, {
      method: "PATCH",
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    location.reload();
  } catch (error) {
    alert(error.message);
  }
}
