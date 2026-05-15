import salesService from "../services/sales.service.js";

export const newForm = (req, res) => {
  res.render("sales/visit", {
    title: "Input Sales Visit",
    error: null,
    old: {},
  });
};

export const create = async (req, res) => {
  try {
    await salesService.create({
      body: req.body,
      files: req.files,
      userId: req.session.user._id,
    });

    return res.redirect("/sales/report");
  } catch (err) {
    return res.status(400).render("sales/visit", {
      title: "Input Sales Visit",
      error: err.message,
      old: req.body,
    });
  }
};

export const myVisits = async (req, res, next) => {
  try {
    const visits = await salesService.findMine(req.session.user._id);

    res.render("sales/my", {
      title: "Sales Visit Saya",
      visits,
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

export const show = async (req, res, next) => {
  try {
    const visit = await salesService.findById(req.params.id);

    if (!visit) return res.status(404).send("Data tidak ditemukan");

    res.render("sales/detail", {
      title: "Detail Sales Visit",
      visit,
    });
  } catch (err) {
    next(err);
  }
};

export const report = async (req, res, next) => {
  try {
    const visits = await salesService.findAll();

    res.render("sales/report", {
      title: "Laporan Sales",
      visits,
      user: req.session.user,
    });
  } catch (err) {
    next(err);
  }
};
