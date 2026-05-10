import SalesVisit from "../models/SalesVisit.js";

/*
|--------------------------------------------------------------------------
| HALAMAN FORM SALES VISIT
|--------------------------------------------------------------------------
*/
export const visitForm = (req, res) => {
  res.render("sales/visit", {
    title: "Input Sales Visit",
  });
};

/*
|--------------------------------------------------------------------------
| SIMPAN KUNJUNGAN SALES
|--------------------------------------------------------------------------
*/
export const storeVisit = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const { customerName, address, note, result, lat, lng } = req.body;

    // foto bukti kunjungan
    const photos = req.files?.map((f) => `/uploads/${f.filename}`) || [];

    const visit = await SalesVisit.create({
      userId,

      customerName,
      address,
      note,
      result,

      location:
        lat && lng
          ? {
              lat,
              lng,
            }
          : null,

      photos,

      visitTime: new Date(),
    });

    return res.json({
      success: true,
      message: "Sales visit berhasil disimpan",
      data: visit,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/*
|--------------------------------------------------------------------------
| LIST SALES VISIT USER
|--------------------------------------------------------------------------
*/
export const myVisits = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const visits = await SalesVisit.find({ userId }).sort({
      createdAt: -1,
    });

    res.render("sales/my", {
      title: "Sales Visit Saya",
      visits,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error load data");
  }
};

/*
|--------------------------------------------------------------------------
| DETAIL SALES VISIT
|--------------------------------------------------------------------------
*/
export const visitDetail = async (req, res) => {
  try {
    const visit = await SalesVisit.findById(req.params.id).populate("userId");

    if (!visit) {
      return res.status(404).send("Data tidak ditemukan");
    }

    res.render("sales/detail", {
      title: "Detail Sales Visit",
      visit,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error detail");
  }
};
export const salesReport = async (req, res) => {
  try {
    const visits = await SalesVisit.find()
      .populate("userId")
      .sort({ createdAt: -1 });

    res.render("sales/report", {
      title: "Laporan Sales",
      visits: visits || [], // 🔥 PENTING
      user: req.session.user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error load sales report");
  }
};
