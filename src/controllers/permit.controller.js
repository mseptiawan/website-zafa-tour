import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import * as permitService from "../services/permit.service.js";
import fs from "fs";

// Rendisi Form Pengajuan Izin Baru
export const create = asyncHandler(async (req, res) => {
  return res.render("permit/form", {
    ...buildRenderData(req, {
      title: "Pengajuan Izin",
      mode: "CREATE",
    }),
  });
});

// Menyimpan Pengajuan Izin Baru ke Database
export const store = asyncHandler(async (req, res) => {
  if (req.validationErrors) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).render("permit/form", {
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
    await permitService.createPermit({
      body: req.body,
      file: req.file,
      currentUser: req.session.user,
    });

    req.flash("success", "Permohonan perizinan berhasil diajukan ke atasan!");
    await new Promise((resolve) => req.session.save(resolve));
    return res.redirect("/permit/history");
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(error.statusCode || 500).render("permit/form", {
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

  const { data: permits, meta } = await permitService.findEmployeeHistory({
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
  } = await permitService.findIncomingPermits({
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
      user: req.session.user, // <-- PERBAIKAN UTAMA: Wajib dipasok agar partial table bisa memvalidasi "Self-Approval"
    }),
  });
});

// Memproses Aksi Persetujuan / Penolakan Berkas Permohonan Izin Karyawan
export const actionApproval = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notesByApprover } = req.body;

  try {
    await permitService.executeApproval({
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
export const edit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employeeId = req.session.user.employeeId;

  try {
    const permit = await permitService.getPermitForEdit({ id, employeeId });
    return res.render("permit/form", {
      ...buildRenderData(req, {
        title: "Ubah Pengajuan Izin",
        mode: "EDIT",
        oldData: permit,
      }),
    });
  } catch (error) {
    req.flash("error", error.message);
    await new Promise((resolve) => req.session.save(resolve));
    return res.redirect("/permit/history");
  }
});

// Memperbarui Data Pengajuan Izin ke Database
export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (req.validationErrors) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).render("permit/form", {
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
    await permitService.updatePermit({
      id,
      body: req.body,
      file: req.file,
      currentUser: req.session.user,
    });

    req.flash("success", "Permohonan perizinan berhasil diperbarui!");
    await new Promise((resolve) => req.session.save(resolve));
    return res.redirect("/permit/history");
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(error.statusCode || 500).render("permit/form", {
      ...buildRenderData(req, {
        title: "Ubah Pengajuan Izin",
        mode: "EDIT",
        oldData: { ...req.body, _id: id },
        error: [error.message],
      }),
    });
  }
});

// Menarik / Menghapus Berkas Pengajuan Izin (Hanya jika status PENDING)
export const destroy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employeeId = req.session.user.employeeId;

  try {
    await permitService.deletePermit({ id, employeeId });
    req.flash("success", "Berkas permohonan izin berhasil ditarik kembali.");
  } catch (error) {
    req.flash("error", error.message || "Gagal menarik berkas perizinan.");
  }

  await new Promise((resolve) => req.session.save(resolve));
  return res.redirect("/permit/history");
});
