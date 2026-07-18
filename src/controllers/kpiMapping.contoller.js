import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import {
  getAllMappingsService,
  getFormDataMappingService,
  storeMappingService,
  getMappingForEditService,
  updateMappingService,
  destroyMappingService,
} from "../services/kpiMapping.service.js";

// 1. GET: Tampilkan semua data mapping (Index)
export const index = asyncHandler(async (req, res) => {
  const mappings = await getAllMappingsService();

  res.render("master/kpi-mapping/index", {
    ...buildRenderData(req, {
      title: "Mapping KPI & Unit Kerja",
      mappings,
    }),
  });
});

// 2. GET: Tampilkan Form Tambah Mapping (Create)
export const create = asyncHandler(async (req, res) => {
  const { templates, units, positions } = await getFormDataMappingService();

  res.render("master/kpi-mapping/create", {
    ...buildRenderData(req, {
      title: "Tambah Mapping KPI Baru",
      templates,
      units,
      positions,
      errorMessage: null,
    }),
  });
});

// 3. POST: Simpan data mapping baru ke database (Store)
export const store = asyncHandler(async (req, res) => {
  try {
    await storeMappingService(req.body);
    req.flash("success", "Konfigurasi mapping KPI berhasil disimpan.");
    return res.redirect("/master/kpi-mapping");
  } catch (error) {
    const { templates, units, positions } = await getFormDataMappingService();

    return res.render("master/kpi-mapping/create", {
      ...buildRenderData(req, {
        title: "Tambah Mapping KPI Baru",
        templates,
        units,
        positions,
        formData: req.body,
        errorMessage: error.message,
      }),
    });
  }
});

// 4. GET: Tampilkan Form Edit Mapping (Edit)
export const edit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { mapping, templates, units, positions } = await getMappingForEditService(id);

  res.render("master/kpi-mapping/edit", {
    ...buildRenderData(req, {
      title: "Ubah Konfigurasi Mapping KPI",
      mapping,
      templates,
      units,
      positions,
      errorMessage: null,
    }),
  });
});

// 5. PUT: Perbarui data mapping di database (Update)
export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    await updateMappingService(id, req.body);
    req.flash("success", "Aturan mapping KPI berhasil diperbarui.");
    return res.redirect("/master/kpi-mapping");
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("back");
  }
});

// 6. DELETE: Hapus aturan mapping (Destroy)
export const destroy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    await destroyMappingService(id);
    req.flash("success", "Aturan konfigurasi mapping berhasil dihapus.");
  } catch (error) {
    req.flash("error", error.message);
  }
  return res.redirect("/master/kpi-mapping");
});
