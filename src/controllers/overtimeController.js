import Overtime from "../models/Overtime.js";
// ==========================
// FORM APPLY
// ==========================
export const showApplyOvertime = (req, res) => {
  res.render("overtime/apply", {
    title: "Ajukan Lembur",
  });
};

// ==========================
// SUBMIT OVERTIME
// ==========================
export const applyOvertime = async (req, res) => {
  try {
    const { date, startTime, endTime, workDescription, result } = req.body;

    /*
    |--------------------------------------------------------------------------
    | VALIDASI FIELD WAJIB
    |--------------------------------------------------------------------------
    */

    if (!date || !startTime || !endTime || !workDescription) {
      return res.send("Semua field wajib diisi");
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDASI DESKRIPSI PEKERJAAN
    |--------------------------------------------------------------------------
    */

    if (workDescription.trim().length < 10) {
      return res.send("Deskripsi pekerjaan minimal 10 karakter");
    }

    if (workDescription.trim().length > 500) {
      return res.send("Deskripsi pekerjaan maksimal 500 karakter");
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDASI HASIL PEKERJAAN
    |--------------------------------------------------------------------------
    */

    if (result && result.trim().length < 10) {
      return res.send("Hasil pekerjaan minimal 10 karakter");
    }

    if (result && result.trim().length > 500) {
      return res.send("Hasil pekerjaan maksimal 500 karakter");
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDASI JAM
    |--------------------------------------------------------------------------
    */

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    if (end <= start) {
      return res.send("Jam selesai harus lebih besar dari jam mulai");
    }

    /*
    |--------------------------------------------------------------------------
    | HITUNG TOTAL JAM
    |--------------------------------------------------------------------------
    */

    const diffMs = end - start;

    const totalHours = diffMs / (1000 * 60 * 60);

    /*
    |--------------------------------------------------------------------------
    | VALIDASI TOTAL JAM
    |--------------------------------------------------------------------------
    */

    if (totalHours > 12) {
      return res.send("Lembur maksimal 12 jam");
    }

    /*
    |--------------------------------------------------------------------------
    | USER SESSION
    |--------------------------------------------------------------------------
    */

    const user = req.session.user;

    const isManager = user.role === "MANAGER";

    /*
    |--------------------------------------------------------------------------
    | SIMPAN DATA
    |--------------------------------------------------------------------------
    */

    await Overtime.create({
      userId: user._id,

      employeeName: user.fullName,

      date,

      startTime,

      endTime,

      totalHours,

      workDescription: workDescription.trim(),

      result: result ? result.trim() : "",

      proofFile: req.file ? req.file.filename : null,

      status: isManager ? "Approved" : "Pending Manager",

      approvedByManager: isManager ? true : false,
    });

    /*
    |--------------------------------------------------------------------------
    | REDIRECT
    |--------------------------------------------------------------------------
    */

    return res.redirect("/overtime/my");
  } catch (err) {
    console.log(err);

    return res.send(err.message);
  }
};
// ==========================
// MY OVERTIME
// ==========================
export const myOvertime = async (req, res) => {
  try {
    const userId = req.session.user._id;

    // page dari query
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // jumlah data per halaman
    const skip = (page - 1) * limit;

    // total data
    const totalData = await Overtime.countDocuments({
      userId: userId,
    });

    const totalPages = Math.ceil(totalData / limit);

    // data paginated
    const overtimes = await Overtime.find({
      userId: userId,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("overtime/my-overtime", {
      title: "Riwayat Lembur",
      overtimes,
      pagination: {
        page,
        totalPages,
        totalData,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
};

// ==========================
// APPROVAL PAGE
// ==========================

export const approvalOvertimePage = async (req, res) => {
  try {
    const user = req.session.user;

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const { search, status, sort } = req.query;

    // filter base
    let filter = {
      userId: { $ne: user._id },
    };

    // status filter
    if (status) {
      filter.status = status;
    } else {
      filter.status = "Pending Manager";
    }

    // search filter
    if (search) {
      filter.employeeName = { $regex: search, $options: "i" };
    }

    // sort
    let sortOption = { createdAt: -1 };
    if (sort === "asc") sortOption = { createdAt: 1 };

    const totalData = await Overtime.countDocuments(filter);

    const overtimes = await Overtime.find(filter)
      .populate("userId")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalData / limit);

    res.render("overtime/approval", {
      title: "Approval Lembur",
      overtimes,
      query: req.query,
      pagination: {
        page,
        totalPages,
        totalData,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
};
// ==========================
// APPROVE MANAGER
// ==========================
export const approveManagerOvertime = async (req, res) => {
  try {
    const overtime = await Overtime.findById(req.params.id);

    overtime.approvedByManager = true;
    overtime.status = "Approved";
    await overtime.save();

    res.redirect("/overtime/approval");
  } catch (err) {
    console.log(err);

    res.send(err.message);
  }
};

// ==========================
// REJECT
// ==========================
export const rejectOvertime = async (req, res) => {
  try {
    const overtime = await Overtime.findById(req.params.id);

    overtime.status = "Rejected";

    await overtime.save();

    res.redirect("/overtime/approval");
  } catch (err) {
    console.log(err);

    res.send(err.message);
  }
};
export const approvalOvertimeHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, status, sort } = req.query;

    // =========================
    // BUILD FILTER
    // =========================
    const filter = {
      status: { $in: ["Approved", "Rejected"] },
    };

    if (search) {
      filter.employeeName = {
        $regex: search,
        $options: "i",
      };
    }

    if (status) {
      filter.status = status; // tetap bisa override Approved/Rejected
    }

    // =========================
    // SORTING
    // =========================
    const sortOption = sort === "asc" ? { createdAt: 1 } : { createdAt: -1 };

    // =========================
    // COUNT
    // =========================
    const totalData = await Overtime.countDocuments(filter);
    const totalPages = Math.ceil(totalData / limit);

    // =========================
    // DATA
    // =========================
    const overtimes = await Overtime.find(filter).sort(sortOption).skip(skip).limit(limit);

    // =========================
    // RENDER
    // =========================
    res.render("overtime/approval-history", {
      title: "Riwayat Approval Lembur",
      overtimes,
      query: req.query,
      pagination: {
        page,
        limit,
        totalData,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};
export const detailOvertime = async (req, res) => {
  try {
    const overtime = await Overtime.findById(req.params.id);

    if (!overtime) {
      return res.send("Data lembur tidak ditemukan");
    }

    res.render("overtime/detail", {
      title: "Detail Lembur",
      overtime,
    });
  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
};
