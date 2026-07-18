import * as templateService from "../services/kpiTemplate.service.js";

// GET /master/kpi-template
export const index = async (req, res, next) => {
  try {
    // getTemplatesWithCount() mengambil template beserta jumlah indikator di dalamnya
    const templates = await templateService.getTemplatesWithCount();

    // FIX: Arahkan ke folder master/kpi-template
    res.render("master/kpi-template/index", {
      title: "Master KPI Template",
      templates,
      user: req.session.user,
    });
  } catch (error) {
    next(error);
  }
};

// GET /master/kpi-template/create
export const create = (req, res) => {
  // FIX: Arahkan ke folder master/kpi-template
  res.render("master/kpi-template/create", {
    title: "Tambah KPI Template",
    user: req.session.user,
  });
};

// POST /master/kpi-template
export const store = async (req, res, next) => {
  try {
    await templateService.createTemplate(req.body);
    res.redirect("/master/kpi-template");
  } catch (error) {
    next(error);
  }
};

// GET /master/kpi-template/:id/edit
export const edit = async (req, res, next) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);

    // FIX: Arahkan ke folder master/kpi-template
    res.render("master/kpi-template/edit", {
      title: "Edit KPI Template",
      template,
      user: req.session.user,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /master/kpi-template/:id
export const update = async (req, res, next) => {
  try {
    await templateService.updateTemplate(req.params.id, req.body);
    res.redirect("/master/kpi-template");
  } catch (error) {
    next(error);
  }
};

// DELETE /master/kpi-template/:id
export const destroy = async (req, res, next) => {
  try {
    await templateService.deleteTemplate(req.params.id);
    res.redirect("/master/kpi-template");
  } catch (error) {
    next(error);
  }
};
