import salesService from "../services/sales.service.js";

export const newForm = (req, res) => {
  res.render("sales/create", {
    title: "Input Sales Visit",
    error: null,
    old: {},
  });
};

export const create = async (req, res) => {
  try {
    await salesService.create({
      body: req.body,
      file: req.file,
      userId: req.session.user._id,
    });

    return res.redirect("/sales/my");
  } catch (err) {
    return res.status(400).render("sales/create", {
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

    res.render("sales/show", {
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

export const edit = async (req, res, next) => {
  try {
    const visit = await salesService.findById(req.params.id);
    if (!visit) {
      return res.status(404).send("Data tidak ditemukan");
    }

    const ownerId = String(visit.userId._id || visit.userId);
    const sessionId = String(req.session.user._id);

    if (ownerId !== sessionId) {
      return res.status(403).send("Tidak diizinkan");
    }

    res.render("sales/edit", {
      title: "Edit Sales Visit",
      visit,
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

/*
|-----------------------------
| UPDATE
|-----------------------------
*/
export const update = async (req, res, next) => {
  try {
    await salesService.update({
      id: req.params.id,
      userId: req.session.user._id,
      body: req.body,
      files: req.files,
    });

    return res.redirect("/sales/my");
  } catch (err) {
    next(err);
  }
};
