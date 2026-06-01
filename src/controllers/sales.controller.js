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
    const visits = await salesService.findMine(req.session.user._id);

    res.render("sales/my", {
      title: "Daftar Kunjungan Ku",
      visits,
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
export const exportPdf = async (req, res, next) => {
  try {
    const visits = await salesService.findMine(req.session.user._id);
    const user = req.session.user;

    // Inisialisasi dokumen PDF (Ukuran A4 dengan Margin 15mm)
    const doc = new PDFDocument({ size: "A4", margin: 42 });

    // Konfigurasi Header Response agar otomatis mengunduh file
    const safeUsername = (user.name || "Sales").replace(/\s+/g, "_");
    const filename = `Riwayat_Kunjungan_${safeUsername}_${Date.now()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    // Stream PDF langsung ke response objek Express
    doc.pipe(res);

    // --- DESAIN PDF ---

    // 1. Header Utama Dokumen
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

    // 2. Blok Informasi Sales (Metadata)
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#334155").text("Informasi Personel:");
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#475569")
      .text(`Nama Sales   : ${user.name || "-"}`)
      .text(`Email              : ${user.email || "-"}`)
      .text(
        `Tanggal Cetak : ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} WIB`
      );

    doc.moveDown(1);
    // Garis Pemisah (Divider Line)
    doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(42, doc.y).lineTo(553, doc.y).stroke();
    doc.moveDown(1.5);

    // 3. Iterasi Data Kunjungan
    if (visits.length === 0) {
      doc
        .font("Helvetica-Oblique")
        .fontSize(11)
        .fillColor("#94a3b8")
        .text("Belum ada data riwayat kunjungan.", { align: "center" });
    } else {
      visits.forEach((v, index) => {
        // Proteksi Page Overflow: Jika sisa halaman terlalu sempit, buat halaman baru
        if (doc.y > 720) {
          doc.addPage();
        }

        const visitDate = new Date(v.visitTime).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        // Judul Kunjungan
        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor("#1e40af")
          .text(`${index + 1}. ${v.title}`);

        // Metadata Kunjungan
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#64748b")
          .text(`Waktu Kunjungan: ${visitDate}   |   Bertemu Dengan: ${v.meetWith}`);

        // Alamat Klien
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#475569")
          .text(`Lokasi / Alamat  : ${v.address}`);

        // Hasil Kunjungan (Jika ada)
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
        // Garis pemisah tipis antar data item
        doc.strokeColor("#f1f5f9").lineWidth(0.5).moveTo(42, doc.y).lineTo(553, doc.y).stroke();
        doc.moveDown(1);
      });
    }

    // Finalisasi Dokumen PDF
    doc.end();
  } catch (err) {
    next(err);
  }
};
