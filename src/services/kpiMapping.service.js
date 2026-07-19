import UnitKpiMapping from "../models/kpi/UnitKpiMapping.model.js";
import KpiTemplate from "../models/kpi/KpiTemplate.model.js";
import Unit from "../models/basic/Unit.model.js";
import Position from "../models/basic/Position.model.js";

export const getAllMappingsService = async () => {
  return await UnitKpiMapping.find()
    .populate("kpiTemplateId", "name")
    .populate("unitId", "name")
    .populate("positionId", "name")
    .sort({ createdAt: -1 });
};

export const getFormDataMappingService = async () => {
  const templates = await KpiTemplate.find({ isActive: true }).select("name");
  const units = await Unit.find().select("name");
  const positions = await Position.find().select("name");
  return { templates, units, positions };
};
export const storeMappingService = async (formData) => {
  // 🛠️ Ambil templateId dari form EJS, lalu petakan ke kpiTemplateId sesuai skema model
  const { templateId, kpiTemplateId, unitId, positionId } = formData;
  const targetTemplateId = kpiTemplateId || templateId;

  // Validasi duplikasi berdasarkan field model asli kamu
  const existingMapping = await UnitKpiMapping.findOne({
    kpiTemplateId: targetTemplateId,
    unitId,
    positionId: positionId || null, // Pastikan jika kosong dipetakan null agar konsisten
  });

  if (existingMapping) {
    throw new Error("Aturan konfigurasi mapping untuk unit dan jabatan tersebut sudah terdaftar.");
  }

  return await UnitKpiMapping.create({
    kpiTemplateId: targetTemplateId,
    unitId,
    positionId: positionId || null,
  });
};

export const getMappingForEditService = async (id) => {
  const mapping = await UnitKpiMapping.findById(id);
  if (!mapping) {
    throw new Error("Data mapping tidak ditemukan");
  }

  const templates = await KpiTemplate.find({ isActive: true }).select("name");
  const units = await Unit.find().select("name");
  const positions = await Position.find().select("name");

  return { mapping, templates, units, positions };
};

export const updateMappingService = async (id, formData) => {
  const { templateId, kpiTemplateId, unitId, positionId } = formData;
  const targetTemplateId = kpiTemplateId || templateId;

  return await UnitKpiMapping.findByIdAndUpdate(id, {
    kpiTemplateId: targetTemplateId,
    unitId,
    positionId: positionId || null,
  });
};

export const destroyMappingService = async (id) => {
  return await UnitKpiMapping.findByIdAndDelete(id);
};
