import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import { getSettings, updateSettings } from "../services/companySetting.service.js";
export const showSettings = asyncHandler(async (req, res) => {
  const companySetting = await getSettings();

  res.render("company-setting/index", {
    ...buildRenderData(req, {
      title: "Konfigurasi Perusahaan",
      companySetting: companySetting || null,
    }),
  });
});

// ─── POST: UPDATE CONFIGURATION (DEBUG VERSION) ──────────────────────
export const handleUpdateSettings = asyncHandler(async (req, res) => {
  const isJsonRequest = req.headers["content-type"] === "application/json";
  if (req.validationErrors) {
    if (isJsonRequest) {
      return res.status(400).json({
        success: false,
        message: "Gagal memperbarui konfigurasi (Gagal Validasi Zod).",
        errors: req.validationErrors,
      });
    }

    return res.status(400).render("company-setting/index", {
      ...buildRenderData(req, {
        title: "Konfigurasi Perusahaan",
        errors: req.validationErrors,
        companySetting: req.body,
        error: ["Gagal memperbarui konfigurasi. Mohon periksa kembali form Anda."],
      }),
    });
  }

  try {
    const updatedData = await updateSettings(req.body);

    req.flash("success", "Konfigurasi perusahaan berhasil diperbarui!");
    await new Promise((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    if (isJsonRequest) {
      return res.status(200).json({
        success: true,
        redirectUrl: "/company-settings",
      });
    }
    return res.redirect("/company-settings");
  } catch (dbError) {
    if (isJsonRequest) {
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada sistem database.",
        error: dbError.message,
      });
    }

    return res.status(500).render("company-setting/index", {
      ...buildRenderData(req, {
        title: "Konfigurasi Perusahaan",
        companySetting: req.body,
        error: [dbError.message],
      }),
    });
  }
});
