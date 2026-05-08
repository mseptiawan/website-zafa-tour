import Leave from "../models/Leave.js";

// FORM AJUKAN CUTI
export const showApplyLeave = (req, res) => {
  res.render("leave/apply", {
    title: "Ajukan Cuti",
  });
};

// SUBMIT CUTI
export const applyLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    const diff = new Date(endDate) - new Date(startDate);

    const totalDays = diff / (1000 * 60 * 60 * 24) + 1;

    await Leave.create({
      userId: req.session.user.id,
      type,
      startDate,
      endDate,
      totalDays,
      reason,
      file: req.file ? req.file.filename : null,
    });

    res.redirect("/leave/my");
  } catch (err) {
    console.log(err);

    res.send("Error");
  }
};

// RIWAYAT CUTI KARYAWAN
export const myLeave = async (req, res) => {
  const leaves = await Leave.find({
    userId: req.session.user.id,
  });

  res.render("leave/my-leave", {
    title: "Riwayat Cuti",
    leaves,
  });
};

// DETAIL CUTI
export const detailLeave = async (req, res) => {
  const leave = await Leave.findById(req.params.id);

  res.render("leave/detail", {
    leave,
  });
};
