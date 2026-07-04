import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import { getSettings, updateSettings } from "../services/companySetting.service.js";
// ─── GET: SHOW CONFIGURATION PAGE ───────────────────────────────────
export const showSettings = asyncHandler(async (req, res) => {
  const companySetting = await getSettings();

  res.render("company-setting/index", {
    ...buildRenderData(req, {
      title: "Konfigurasi Perusahaan",
      companySetting: companySetting || null, // Ganti dari 'settings' ke 'companySetting'
    }),
  });
});

// ─── POST: UPDATE CONFIGURATION (DEBUG VERSION) ──────────────────────
export const handleUpdateSettings = asyncHandler(async (req, res) => {
  console.log("\n=================== 🪵 START DEBUGGING REQUEST 🪵 ===================");

  // 1. Log Headers & Content-Type
  console.log("📥 [HEADERS]:", JSON.stringify(req.headers, null, 2));
  const isJsonRequest =
    req.is("application/json") ||
    req.xhr ||
    req.headers["content-type"]?.includes("application/json");
  console.log(`🧐 Is JSON/Fetch Request?: ${isJsonRequest}`);

  // 2. Log Data yang Masuk dari Frontend (Form/Fetch payload)
  console.log("📦 [RAW REQ.BODY]:", JSON.stringify(req.body, null, 2));
  console.log(
    `   └─ gracePeriodMinutes type: ${typeof req.body?.gracePeriodMinutes} (value: ${req.body?.gracePeriodMinutes})`
  );

  // 3. Cek apakah ada error dari Middleware Validasi Zod
  if (req.validationErrors) {
    console.error("❌ [VALIDATION FAILED] Terhenti di Zod Validator!");
    console.error("🚨 [ZOD ERRORS DETAIL]:", JSON.stringify(req.validationErrors, null, 2));
    console.log("=================== 🪵 END DEBUGGING REQUEST 🪵 ===================\n");

    if (isJsonRequest) {
      return res.status(400).json({
        success: false,
        message: "Gagal memperbarui konfigurasi (Gagal Validasi Zod).",
        errors: req.validationErrors, // Mengembalikan detail error Zod ke browser console
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

  // 4. Jika lolos Zod, mari kita coba hajar ke database
  try {
    console.log("🚀 Lolos Zod! Mencoba mengeksekusi updateSettings() ke DB...");

    // Pastikan fungsi updateSettings kamu di-import dengan benar
    const updatedData = await updateSettings(req.body);

    console.log("✅ [DB SUCCESS] Data berhasil disimpan di MongoDB!");
    console.log("📄 [UPDATED DATA FROM DB]:", JSON.stringify(updatedData, null, 2));
    console.log("=================== 🪵 END DEBUGGING REQUEST 🪵 ===================\n");

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
    // 5. Tangkap jika ternyata error-nya ada di database / layer service
    console.error("💥 [DATABASE/SERVICE CRASH] Error saat eksekusi Mongoose!");
    console.error("🚨 [STACK TRACE]:", dbError.stack);
    console.log("=================== 🪵 END DEBUGGING REQUEST 🪵 ===================\n");

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
