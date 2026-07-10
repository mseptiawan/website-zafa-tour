import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import {
  createPermitService,
  updatePermitService,
  cancelPermitService,
  findEmployeeHistoryService,
  findIncomingPermitsService,
  executeApprovalService,
  getPermitForEditService,
} from "../services/permit.service.js";

import fs from "fs";

// Rendisi Form Pengajuan Izin Baru
export const renderCreatePermitForm = asyncHandler(async (req, res) => {
  return res.render("permit/create", {
    ...buildRenderData(req, {
      title: "Pengajuan Izin",
      mode: "CREATE",
    }),
  });
});

// Menyimpan Pengajuan Izin Baru ke Database
export const storePermit = asyncHandler(async (req, res) => {
  if (req.validationErrors) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).render("permit/create", {
      ...buildRenderData(req, {
        title: "Pengajuan Izin",
        mode: "CREATE",
        errors: req.validationErrors,
        oldData: req.body,
        error: ["Sila lengkapi semua isian wajib formulir."],
      }),
    });
  }

  try {
    await createPermitService({
      body: req.body,
      file: req.file,
      currentUser: req.session.user,
    });

    req.flash("success", "Permohonan perizinan berhasil diajukan ke atasan!");
    await new Promise((resolve) => req.session.save(resolve));
    return res.redirect("/permit/me");
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(error.statusCode || 500).render("permit/create", {
      ...buildRenderData(req, {
        title: "Pengajuan Izin",
        mode: "CREATE",
        errors: error.field ? { [error.field]: error.message } : {},
        oldData: req.body,
        error: [error.message],
      }),
    });
  }
});

// Menampilkan Riwayat Pengajuan Izin Pribadi (Karyawan)
export const getHistoryPermits = asyncHandler(async (req, res) => {
  const { page } = req.query;
  const employeeId = req.session.user.employeeId;

  const { data: permits, meta } = await findEmployeeHistoryService({
    employeeId,
    page,
  });

  return res.render("permit/history", {
    ...buildRenderData(req, {
      title: "Riwayat Pengajuan Izin",
      permits,
      pagination: meta,
      query: req.query,
      type: "history",
      user: req.session.user,
    }),
  });
});

// Menampilkan Antrean Berkas Izin Masuk (Direksi/Atasan)
export const getIncomingPermits = asyncHandler(async (req, res) => {
  const { page } = req.query;

  const {
    data: permits,
    meta,
    summary,
  } = await findIncomingPermitsService({
    currentUser: req.session.user,
    page,
  });

  return res.render("permit/approvals", {
    ...buildRenderData(req, {
      title: "Otorisasi Perizinan",
      permits,
      pagination: meta,
      query: req.query,
      currentRole: req.session.user.role,
      summary,
      user: req.session.user,
    }),
  });
});

// Memproses Aksi Persetujuan / Penolakan Berkas Permohonan Izin Karyawan
export const actionApproval = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notesByApprover } = req.body;

  try {
    await executeApprovalService({
      id,
      status,
      notesByApprover,
      currentUser: req.session.user,
    });

    req.flash("success", `Berkas perizinan berhasil diperbarui menjadi ${status}!`);
  } catch (error) {
    req.flash("error", error.message || "Gagal mengeksekusi keputusan otorisasi.");
  }

  await new Promise((resolve) => req.session.save(resolve));
  return res.redirect("/permit/incoming");
});

// Rendisi Form Edit Izin (Hanya jika status PENDING)
export const editPermit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employeeId = req.session.user.employeeId;

  try {
    const permit = await getPermitForEditService({ id, employeeId });
    return res.render("permit/create", {
      ...buildRenderData(req, {
        title: "Ubah Pengajuan Izin",
        mode: "EDIT",
        oldData: permit,
      }),
    });
  } catch (error) {
    req.flash("error", error.message);
    await new Promise((resolve) => req.session.save(resolve));
    return res.redirect("/permit/me");
  }
});

// Memperbarui Data Pengajuan Izin ke Database
export const updatePermit = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (req.validationErrors) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).render("permit/create", {
      ...buildRenderData(req, {
        title: "Ubah Pengajuan Izin",
        mode: "EDIT",
        errors: req.validationErrors,
        oldData: { ...req.body, _id: id },
        error: ["Sila lengkapi semua isian wajib formulir."],
      }),
    });
  }

  try {
    await updatePermitService({
      id,
      body: req.body,
      file: req.file,
      currentUser: req.session.user,
    });

    req.flash("success", "Permohonan perizinan berhasil diperbarui!");
    await new Promise((resolve) => req.session.save(resolve));
    return res.redirect("/permit/me");
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(error.statusCode || 500).render("permit/create", {
      ...buildRenderData(req, {
        title: "Ubah Pengajuan Izin",
        mode: "EDIT",
        oldData: { ...req.body, _id: id },
        error: [error.message],
      }),
    });
  }
});

export const cancelPermit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employeeId = req.session.user.employeeId;

  try {
    await cancelPermitService({ id, employeeId });
    req.flash("success", "Berkas permohonan izin berhasil ditarik kembali.");
  } catch (error) {
    req.flash("error", error.message || "Gagal menarik berkas perizinan.");
  }

  await new Promise((resolve) => req.session.save(resolve));
  return res.redirect("/permit/me");
});
