import KpiTemplate from "../models/kpi/KpiTemplate.model.js";
import KpiTemplateDetail from "../models/kpi/KpiTemplateDetail.model.js";

/**
 * ============================================================================
 * 1. SERVICE UNTUK KPI TEMPLATE (PARENT)
 * ============================================================================
 */

// Mengambil semua template beserta jumlah indikator di dalamnya
export const getTemplatesWithCount = async () => {
  // Menggunakan aggregate agar bisa menghitung child rows secara efisien
  return await KpiTemplate.aggregate([
    {
      $lookup: {
        from: "kpitemplatedetails", // Pastikan nama collection di MongoDB sesuai (biasanya lowercase & jamak)
        localField: "_id",
        foreignField: "kpiTemplateId",
        as: "details",
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        isActive: 1,
        indicatorsCount: { $size: "$details" },
      },
    },
    { $sort: { name: 1 } },
  ]);
};

export const createTemplate = async (templateData) => {
  const template = new KpiTemplate({
    name: templateData.name,
    description: templateData.description,
    isActive: templateData.isActive === "true" || templateData.isActive === true,
  });
  return await template.save();
};

export const getTemplateById = async (id) => {
  const template = await KpiTemplate.findById(id);
  if (!template) {
    throw new Error("Template KPI tidak ditemukan.");
  }
  return template;
};

export const updateTemplate = async (id, templateData) => {
  return await KpiTemplate.findByIdAndUpdate(
    id,
    {
      name: templateData.name,
      description: templateData.description,
      isActive: templateData.isActive === "true" || templateData.isActive === true,
    },
    { new: true, runValidators: true }
  );
};

// Menghapus template sekaligus membersihkan detail di dalamnya (Cascade Delete)
export const deleteTemplate = async (id) => {
  await KpiTemplateDetail.deleteMany({ kpiTemplateId: id });
  return await KpiTemplate.findByIdAndDelete(id);
};

/**
 * ============================================================================
 * 2. SERVICE UNTUK KPI TEMPLATE DETAIL (CHILD)
 * ============================================================================
 */

// Mengambil detail indikator berdasarkan Template ID, diurutkan dari field `order`
export const getDetailsByTemplateId = async (templateId) => {
  return await KpiTemplateDetail.find({ kpiTemplateId: templateId }).sort({ order: 1 });
};

export const getDetailById = async (detailId) => {
  const detail = await KpiTemplateDetail.findById(detailId);
  if (!detail) {
    throw new Error("Indikator KPI tidak ditemukan.");
  }
  return detail;
};

// Membuat detail indikator baru (Validasi total bobot 100% DIHAPUS)
export const createTemplateDetail = async (templateId, detailData) => {
  const newBobot = Number(detailData.bobot);

  const detail = new KpiTemplateDetail({
    kpiTemplateId: templateId,
    areaKinerja: detailData.areaKinerja,
    indikator: detailData.indikator,
    bobot: newBobot,
    target: detailData.target,
    order: Number(detailData.order) || 1,
  });

  return await detail.save();
};

// Memperbarui detail indikator (Validasi total bobot 100% DIHAPUS)
export const updateTemplateDetail = async (detailId, detailData) => {
  const newBobot = Number(detailData.bobot);

  return await KpiTemplateDetail.findByIdAndUpdate(
    detailId,
    {
      areaKinerja: detailData.areaKinerja,
      indikator: detailData.indikator,
      bobot: newBobot,
      target: detailData.target,
      order: Number(detailData.order) || 1,
    },
    { new: true, runValidators: true }
  );
};

export const deleteTemplateDetail = async (detailId) => {
  return await KpiTemplateDetail.findByIdAndDelete(detailId);
};
