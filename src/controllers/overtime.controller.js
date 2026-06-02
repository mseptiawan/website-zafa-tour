import { Overtime } from "../models/Overtime.model.js";
import { createOvertimeService } from "../services/overtime.service.js";

export const showApplyOvertime = (req, res) => {
  return res.render("overtime/new", {
    title: "Catat Lembur",
    errors: {},
    old: {},
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

    return res.render("overtime/new", {
      title: "Catat Lembur",
      errors: {
        general: err.message,
      },
      old: req.body,
    });
  }
};

export const myOvertime = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalData = await Overtime.countDocuments({ userId });

    const totalPages = Math.ceil(totalData / limit);

    const overtimes = await Overtime.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.render("overtime/my-overtime", {
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
    return res.status(500).send(err.message);
  }
};

export const approvalOvertimePage = async (req, res) => {
  try {
    const user = req.session.user;

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const { search, status, sort, tab = "active" } = req.query;

    const baseFilter = {
      userId: { $ne: user._id },
    };

    if (search) {
      baseFilter.employeeName = { $regex: search, $options: "i" };
    }

    const sortOption = sort === "asc" ? { createdAt: 1 } : { createdAt: -1 };

    const activeFilter = {
      ...baseFilter,
      status: "SUBMITTED",
    };

    const historyFilter = {
      ...baseFilter,
      status: { $in: ["APPROVED", "REJECTED"] },
    };

    const [totalActive, totalHistory, activeOvertimes, historyOvertimes] = await Promise.all([
      Overtime.countDocuments(activeFilter),
      Overtime.countDocuments(historyFilter),

      Overtime.find(activeFilter)
        .populate("userId")
        .sort(sortOption)
        .skip(tab === "active" ? skip : 0)
        .limit(tab === "active" ? limit : 10),

      Overtime.find(historyFilter)
        .populate("userId")
        .sort(sortOption)
        .skip(tab === "history" ? skip : 0)
        .limit(tab === "history" ? limit : 10),
    ]);

    return res.render("overtime/approval", {
      title: "Pusat Approval Lembur",
      activeOvertimes,
      historyOvertimes,
      activeQuery: tab === "active" ? req.query : {},
      historyQuery: tab === "history" ? req.query : {},

      activePagination: {
        page: tab === "active" ? page : 1,
        totalPages: Math.ceil(totalActive / limit) || 1,
        totalData: totalActive,
        hasPrev: page > 1,
        hasNext: page < Math.ceil(totalActive / limit),
      },

      historyPagination: {
        page: tab === "history" ? page : 1,
        totalPages: Math.ceil(totalHistory / limit) || 1,
        totalData: totalHistory,
        hasPrev: page > 1,
        hasNext: page < Math.ceil(totalHistory / limit),
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.message);
  }
};

export const approveManagerOvertime = async (req, res) => {
  try {
    const overtime = await Overtime.findById(req.params.id);

    if (!overtime) return res.send("Data tidak ditemukan");

    overtime.status = "APPROVED";
    overtime.payrollStatus = "PENDING";

    overtime.approvedBy = req.session.user._id;
    overtime.approvedAt = new Date();

    overtime.approvalHistory.push({
      action: "APPROVED",
      by: req.session.user._id,
      role: req.session.user.role,
      at: new Date(),
    });

    await overtime.save();

    return res.redirect("/overtime/approval");
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.message);
  }
};

export const rejectOvertime = async (req, res) => {
  try {
    const overtime = await Overtime.findById(req.params.id);

    if (!overtime) return res.send("Data tidak ditemukan");

    overtime.status = "REJECTED";
    overtime.payrollStatus = "LOCKED";

    overtime.approvedBy = req.session.user._id;
    overtime.approvedAt = new Date();

    overtime.approvalHistory.push({
      action: "REJECTED",
      by: req.session.user._id,
      role: req.session.user.role,
      at: new Date(),
    });

    await overtime.save();

    return res.redirect("/overtime/approval");
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.message);
  }
};

export const approvalOvertimeHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, status, sort } = req.query;

    const filter = {
      userId: { $exists: true },
      status: { $in: ["APPROVED", "REJECTED"] },
    };

    if (search) {
      filter.employeeName = { $regex: search, $options: "i" };
    }

    if (status) {
      filter.status = status;
    }

    const sortOption = sort === "asc" ? { createdAt: 1 } : { createdAt: -1 };

    const totalData = await Overtime.countDocuments(filter);

    const overtimes = await Overtime.find(filter).sort(sortOption).skip(skip).limit(limit);

    return res.render("overtime/approval-history", {
      title: "Riwayat Approval Lembur",
      overtimes,
      query: req.query,
      pagination: {
        page,
        limit,
        totalData,
        totalPages: Math.ceil(totalData / limit),
        hasPrev: page > 1,
        hasNext: page < Math.ceil(totalData / limit),
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.message);
  }
};

export const detailOvertime = async (req, res) => {
  try {
    const overtime = await Overtime.findById(req.params.id);

    if (!overtime) return res.send("Data lembur tidak ditemukan");

    return res.render("overtime/detail", {
      title: "Detail Lembur",
      overtime,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.message);
  }
};
