import { Overtime } from "../models/Overtime.model.js";
import { createOvertimeService } from "../services/overtime.service.js";

export const showApplyOvertime = (req, res) => {
  res.render("overtime/new", {
    title: "Catat Lembur",
  });
};

export const applyOvertime = async (req, res) => {
  try {
    if (req.validationErrors) {
      return res.render("overtime/new", {
        title: "Catat Lembur",
        errors: req.validationErrors,
        old: req.body,
      });
    }

    await createOvertimeService({
      user: req.session.user,
      body: req.body,
      file: req.file,
    });

    return res.redirect("/overtime/my");
  } catch (err) {
    console.log(err);
    return res.send(err.message);
  }
};
export const myOvertime = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalData = await Overtime.countDocuments({
      userId: userId,
    });

    const totalPages = Math.ceil(totalData / limit);

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

export const approvalOvertimePage = async (req, res) => {
  try {
    const user = req.session.user;

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const { search, status, sort } = req.query;

    let filter = {
      userId: { $ne: user._id },
    };

    if (status) {
      filter.status = status;
    } else {
      filter.status = "SUBMITTED";
    }

    if (search) {
      filter.employeeName = { $regex: search, $options: "i" };
    }

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
export const approveManagerOvertime = async (req, res) => {
  try {
    const overtime = await Overtime.findById(req.params.id);

    if (!overtime) {
      return res.send("Data tidak ditemukan");
    }

    overtime.status = "APPROVED";

    overtime.approvedBy = req.session.user._id;

    overtime.approvedAt = new Date();

    overtime.approvalHistory.push({
      action: "APPROVED",
      by: req.session.user._id,
    });

    await overtime.save();

    res.redirect("/overtime/approval");
  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
};

export const rejectOvertime = async (req, res) => {
  try {
    const overtime = await Overtime.findById(req.params.id);

    if (!overtime) {
      return res.send("Data tidak ditemukan");
    }

    overtime.status = "REJECTED";

    overtime.approvedBy = req.session.user._id;

    overtime.approvedAt = new Date();

    overtime.approvalHistory.push({
      action: "REJECTED",
      by: req.session.user._id,
    });

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

    const filter = {
      status: { $in: ["APPROVED", "REJECTED"] },
    };

    if (search) {
      filter.employeeName = {
        $regex: search,
        $options: "i",
      };
    }

    if (status) {
      filter.status = status;
    }

    const sortOption = sort === "asc" ? { createdAt: 1 } : { createdAt: -1 };

    const totalData = await Overtime.countDocuments(filter);
    const totalPages = Math.ceil(totalData / limit);

    const overtimes = await Overtime.find(filter).sort(sortOption).skip(skip).limit(limit);

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
