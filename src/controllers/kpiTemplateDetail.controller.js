import * as templateService from "../services/kpiTemplate.service.js";

// GET /master/kpi-template/:templateId/details
export const index = async (req, res, next) => {
  try {
    const { templateId } = req.params;
    const template = await templateService.getTemplateById(templateId);
    const details = await templateService.getDetailsByTemplateId(templateId);

    // FIX: Arahkan ke folder kpi-template-detail
    res.render("master/kpi-template-detail/index", {
      title: `Kelola KPI - ${template.name}`,
      template,
      details,
      user: req.session.user,
    });
  } catch (error) {
    next(error);
  }
};

// GET /master/kpi-template/:templateId/details/create
export const create = async (req, res, next) => {
  try {
    const { templateId } = req.params;
    const template = await templateService.getTemplateById(templateId);

    // FIX: Arahkan ke folder kpi-template-detail
    res.render("master/kpi-template-detail/create", {
      title: `Tambah Indikator - ${template.name}`,
      templateId,
      user: req.session.user,
    });
  } catch (error) {
    next(error);
  }
};

// POST /master/kpi-template/:templateId/details
export const store = async (req, res, next) => {
  try {
    const { templateId } = req.params;
    await templateService.createTemplateDetail(templateId, req.body);
    res.redirect(`/master/kpi-template/${templateId}/details`);
  } catch (error) {
    next(error);
  }
};

// GET /master/kpi-template/:templateId/details/:detailId/edit
export const edit = async (req, res, next) => {
  try {
    const { templateId, detailId } = req.params;
    const detail = await templateService.getDetailById(detailId);

    // FIX: Arahkan ke folder kpi-template-detail
    res.render("master/kpi-template-detail/edit", {
      title: "Edit Indikator KPI",
      templateId,
      detail,
      user: req.session.user,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /master/kpi-template/:templateId/details/:detailId
export const update = async (req, res, next) => {
  try {
    const { templateId, detailId } = req.params;
    await templateService.updateTemplateDetail(detailId, req.body);
    res.redirect(`/master/kpi-template/${templateId}/details`);
  } catch (error) {
    next(error);
  }
};

// DELETE /master/kpi-template/:templateId/details/:detailId
export const destroy = async (req, res, next) => {
  try {
    const { templateId, detailId } = req.params;
    await templateService.deleteTemplateDetail(detailId);
    res.redirect(`/master/kpi-template/${templateId}/details`);
  } catch (error) {
    next(error);
  }
};
