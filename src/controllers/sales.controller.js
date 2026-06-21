import { getPagination } from "../utils/pagination.js";
import salesService from "../services/sales.service.js";
import PDFDocument from "pdfkit";
export const newForm = (req, res) => {
  res.render("sales/create", {
    title: "Catat Kunjungan",
    error: null,
    old: {},
  });
};
export const create = async (req, res) => {
  try {
    if (req.validationErrors) {
      return res.status(400).render("sales/create", {
        title: "Catat Kunjungan",
        errors: req.validationErrors,
        validationErrors: req.validationErrors,
        old: req.body,
      });
    }

    await salesService.create({
      body: req.body,
      file: req.file,
      userId: req.session.user._id,
    });

    return res.redirect("/sales/my");
  } catch (err) {
    return res.status(400).render("sales/create", {
      title: "Catat Kunjungan",
      error: err.message,
      old: req.body,
    });
  }
};
export const myVisits = async (req, res, next) => {
  try {
    // 1. Tentukan limit dinamis: mobile = 5, desktop = 9 agar pas dengan viewport perangkat
    const determinedLimit = req.useragent?.isMobile ? 5 : 7;

    // 2. Olah parameter pagination menggunakan utilitas yang sudah lo punya
    const { page, limit, skip } = getPagination({
      page: req.query.page,
      limit: determinedLimit,
    });

    // 3. Ambil data spesifik milik user yang sedang login dengan membawa parameter pagination
    const userId = req.session.user._id;
    const result = await salesService.findMinePaged({ userId, page, limit, skip });

    res.render("sales/my", {
      title: "Daftar Kunjungan Ku",
      visits: result.data,
      pagination: result.meta,
      error: null,
    });
  } catch (err) {
    next(err);
  }
};
export const report = async (req, res, next) => {
  try {
    const visits = await salesService.findAll();

    res.render("sales/report", {
      title: "Laporan",
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
      title: "Edit Kunjungan",
      visit,
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    // 1. Jika validasi input gagal (misal teks terlalu panjang/format salah)
    if (req.validationErrors) {
      // Ambil kembali data visit dari DB agar form edit tidak crash (visit is not defined)
      const visit = await salesService.findById(req.params.id);

      // Ambil data yang barusan diketik user agar tidak hilang saat reload form
      const updatedData = Object.assign(visit, req.body);

      return res.status(400).render("sales/edit", {
        title: "Edit Kunjungan",
        visit: updatedData, // <-- WAJIB DIKIRIM BALIK BIAR EJS TIDAK ERROR
        errors: req.validationErrors,
        validationErrors: req.validationErrors,
        error: "Validasi gagal, silakan periksa inputan Anda.",
      });
    }

    // 2. Jalankan proses update ke service jika validasi aman
    await salesService.update({
      id: req.params.id,
      userId: req.session.user._id,
      body: req.body,
      file: req.file,
    });

    return res.redirect("/sales/my");
  } catch (err) {
    // 3. Jika terjadi error di level database/service (misal: sudah lewat 24 jam)
    try {
      const visit = await salesService.findById(req.params.id);
      return res.status(400).render("sales/edit", {
        title: "Edit Kunjungan",
        visit, // <-- WAJIB DIKIRIM BALIK DI BLOK CATCH
        error: err.message,
      });
    } catch (innerErr) {
      next(err);
    }
  }
};
export const exportPdf = async (req, res, next) => {
  try {
    const visits = await salesService.findMine(req.session.user._id);
    const user = req.session.user;

    const doc = new PDFDocument({ size: "A4", margin: 42 });

    const safeUsername = user.fullName || "Sales";
    const filename = `Riwayat_Kunjungan_${safeUsername}_${Date.now()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    doc.pipe(res);

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#1e293b")
      .text("LAPORAN RIWAYAT SALES VISIT", { align: "center" });
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#64748b")
      .text("Sistem Manajemen Kunjungan - Zafa Tour", { align: "center" });
    doc.moveDown(1.5);

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#334155").text("Informasi Personel:");
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#475569")
      .text(`Nama Sales : ${user.fullName || "-"}`)
      .text(`Email              : ${user.email || "-"}`)
      .text(
        `Tanggal Cetak : ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} WIB`
      );

    doc.moveDown(1);
    doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(42, doc.y).lineTo(553, doc.y).stroke();
    doc.moveDown(1.5);

    if (visits.length === 0) {
      doc
        .font("Helvetica-Oblique")
        .fontSize(11)
        .fillColor("#94a3b8")
        .text("Belum ada data riwayat kunjungan.", { align: "center" });
    } else {
      visits.forEach((v, index) => {
        if (doc.y > 720) {
          doc.addPage();
        }

        const visitDate = new Date(v.visitTime).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor("#1e40af")
          .text(`${index + 1}. ${v.title}`);

        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#64748b")
          .text(`Waktu Kunjungan: ${visitDate}   |   Bertemu Dengan: ${v.meetWith}`);

        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#475569")
          .text(`Lokasi / Alamat  : ${v.address}`);

        if (v.result) {
          doc.moveDown(0.4);
          doc
            .font("Helvetica-Bold")
            .fontSize(9)
            .fillColor("#334155")
            .text("Hasil Kunjungan:", { continued: true });
          doc.font("Helvetica").fontSize(9).fillColor("#475569").text(` ${v.result}`);
        }

        doc.moveDown(1);
        doc.strokeColor("#f1f5f9").lineWidth(0.5).moveTo(42, doc.y).lineTo(553, doc.y).stroke();
        doc.moveDown(1);
      });
    }

    doc.end();
  } catch (err) {
    next(err);
  }
};
