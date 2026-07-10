import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import {
  createSalesVisit,
  findMinePaged,
  findById,
  updateSalesVisit,
  findMineRaw,
  findAllPaged,
  generateSalesVisitPdf,
} from "../services/sales.service.js";

const saveSession = (req) =>
  new Promise((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });

// ─── METHOD 1: FORM CREATE ──────────────────────────────────────────
export const create = asyncHandler(async (req, res) => {
  res.render("sales/create", { ...buildRenderData(req, { title: "Catat Kunjungan" }) });
});

// ─── METHOD 2: STORE DATA ───────────────────────────────────────────
export const store = asyncHandler(async (req, res) => {
  const { employeeId } = req.session.user;

  if (req.validationErrors) {
    return res.status(400).render("sales/create", {
      ...buildRenderData(req, {
        title: "Catat Kunjungan",
        errors: req.validationErrors,
        validationErrors: req.validationErrors,
        old: req.body,
        error: ["Mohon periksa kembali form pengisian Anda."],
      }),
    });
  }

  try {
    await createSalesVisit({ body: req.body, file: req.file, employeeId });
    req.flash("success", "Data kunjungan sales berhasil dicatat!");
    await saveSession(req);
    return res.redirect("/sales/my");
  } catch (err) {
    return res.status(400).render("sales/create", {
      ...buildRenderData(req, { title: "Catat Kunjungan", error: [err.message], old: req.body }),
    });
  }
});

// ─── METHOD 3: KUNJUNGAN SAYA ───────────────────────────────────────
export const my = asyncHandler(async (req, res) => {
  const determinedLimit = req.useragent?.isMobile ? 5 : 7;
  const { employeeId } = req.session.user;

  const { data: visits, meta } = await findMinePaged({
    employeeId,
    page: req.query.page,
    limit: determinedLimit,
  });

  res.render("sales/history", {
    ...buildRenderData(req, {
      title: "Daftar Kunjungan Ku",
      visits,
      pagination: meta,
      query: req.query,
    }),
  });
});

// ─── METHOD 4: FORM EDIT ────────────────────────────────────────────
export const edit = asyncHandler(async (req, res) => {
  const { employeeId } = req.session.user;
  const visit = await findById(req.params.id);

  if (!visit)
    throw Object.assign(new Error("Data kunjungan tidak ditemukan."), { statusCode: 404 });

  const ownerId = String(visit.employeeId?._id || visit.employeeId);
  if (ownerId !== String(employeeId)) {
    throw Object.assign(new Error("Anda tidak diizinkan menyunting berkas dokumen ini."), {
      statusCode: 403,
    });
  }

  res.render("sales/edit", { ...buildRenderData(req, { title: "Edit Kunjungan", visit }) });
});

// ─── METHOD 5: UPDATE DATA ──────────────────────────────────────────
export const update = asyncHandler(async (req, res, next) => {
  const visitId = req.params.id;
  const { employeeId } = req.session.user;

  if (req.validationErrors) {
    const visit = await findById(visitId);
    return res.status(400).render("sales/edit", {
      ...buildRenderData(req, {
        title: "Edit Kunjungan",
        visit: Object.assign(visit || {}, req.body),
        errors: req.validationErrors,
        validationErrors: req.validationErrors,
        error: ["Validasi gagal, silakan periksa kembali inputan Anda."],
      }),
    });
  }

  try {
    await updateSalesVisit({
      id: visitId,
      employeeId,
      body: req.body,
      file: req.file,
    });
    req.flash("success", "Data catatan kunjungan berhasil diperbarui!");
    await saveSession(req);
    return res.redirect("/sales/my");
  } catch (err) {
    try {
      const visit = await findById(visitId);
      return res.status(400).render("sales/edit", {
        ...buildRenderData(req, { title: "Edit Kunjungan", visit, error: [err.message] }),
      });
    } catch (innerErr) {
      next(err);
    }
  }
});

// ─── METHOD 6: EXPORT DATA PDF ──────────────────────────────────────
export const exportPdf = asyncHandler(async (req, res) => {
  const { employeeId } = req.session.user;
  const visits = await findMineRaw(employeeId);

  const pdfBuffer = await generateSalesVisitPdf(req.session.user, visits);

  const safeUsername = (req.session.user.fullName || "Sales").replace(/\s+/g, "_");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Riwayat_Kunjungan_${safeUsername}_${Date.now()}.pdf`
  );
  return res.end(pdfBuffer);
});

// ─── METHOD 7: MONITORING TIM ───────────────────────────────────────
export const employeeVisits = asyncHandler(async (req, res) => {
  const determinedLimit = req.useragent?.isMobile ? 5 : 7;
  const { role, bidangId } = req.session.user;

  const isWadirOrDirektur = ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"].includes(role);

  const { data: visits, meta } = await findAllPaged({
    page: req.query.page,
    limit: determinedLimit,
    userBidangId: bidangId,
    isWadirOrDirektur,
  });

  res.render("sales/employee-sales-visits", {
    ...buildRenderData(req, {
      title: isWadirOrDirektur
        ? "Monitoring Semua Kunjungan Sales"
        : "Monitoring Kunjungan Bidang Anda",
      visits,
      pagination: meta,
      query: req.query,
    }),
  });
});
