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
    const user = req.session.user;

    if (!user) {
      return res.status(401).send("Session tidak valid");
    }

    const { customerName, address, meetWith, result, note, lat, lng } =
      req.body;

    // FOTO (bisa multiple atau single)
    let photos = [];

    if (req.file) {
      photos.push(`/uploads/${req.file.filename}`);
    }

    if (req.files && req.files.length > 0) {
      photos = req.files.map((f) => `/uploads/${f.filename}`);
    }

    const visit = await SalesVisit.create({
      userId: user._id,

      customerName,
      address,
      meetWith,
      result,
      note,

      location:
        lat && lng
          ? {
              lat: Number(lat),
              lng: Number(lng),
            }
          : null,

      photos,

      visitTime: new Date(),
    });

    return res.redirect("/sales/report");
  } catch (err) {
    console.log("STORE SALES VISIT ERROR:", err);
    return res.status(500).send("Gagal menyimpan sales visit");
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
