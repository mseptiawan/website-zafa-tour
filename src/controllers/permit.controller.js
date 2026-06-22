import User from "../models/basic/User.model.js";
import Permit from "../models/Permit.model.js";
import Role from "../models/basic/Role.model.js";
import fs from "fs";
export const newForm = async (req, res) => {
  try {
    res.render("permit/create", {
      title: "Pengajuan Izin",
      mode: "CREATE",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPermit = async (req, res) => {
  try {
    if (req.validationErrors) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).render("permit/create", {
        title: "Pengajuan Izin & Cuti",
        errors: req.validationErrors,
        oldData: req.body,
      });
    }

    const { type, date, reason } = req.body;

    if (type === "SAKIT" && !req.file) {
      return res.status(400).render("permit/create", {
        title: "Pengajuan Izin & Cuti",
        errors: { document: "Izin sakit wajib menyertakan dokumen surat dokter." },
        oldData: req.body,
      });
    }

    const documentPath = req.file ? `/uploads/files/${req.file.filename}` : null;
    const newPermit = new Permit({
      user: req.user._id,
      type,
      date,
      reason,
      document: documentPath,
    });

    await newPermit.save();
    res.redirect("/permit/history");
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHistoryPermits = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const permits = await Permit.find({ user: userId })
      .populate({
        path: "user",
        select: "name roleId",
        populate: {
          path: "employeeData",
          select: "fullName careerData",
          populate: {
            path: "careerData",
            populate: {
              path: "bidangId",
              select: "name",
            },
          },
        },
      })
      .sort({ createdAt: -1 });

    res.render("permit/history", {
      title: "Riwayat Pengajuan Izin",
      permits,
      type: "history",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getIncomingPermits = async (req, res) => {
  try {
    const userRoleName = req.session.user.role;
    const currentUserId = req.session.user._id;

    const wadirRole = await Role.findOne({ name: "WAKIL_DIREKTUR" });
    const dirutRole = await Role.findOne({ name: "DIREKTUR_UTAMA" });

    const wadirUserIds = wadirRole
      ? await User.find({ roleId: wadirRole._id }).distinct("_id")
      : [];
    const dirutUserIds = dirutRole
      ? await User.find({ roleId: dirutRole._id }).distinct("_id")
      : [];

    let query = {};

    if (userRoleName === "DIREKTUR_UTAMA") {
      query = {
        user: { $in: wadirUserIds, $ne: currentUserId },
      };
    } else if (userRoleName === "WAKIL_DIREKTUR") {
      query = {
        user: {
          $nin: [...wadirUserIds, ...dirutUserIds],
          $ne: currentUserId,
        },
      };
    } else {
      query = { _id: null };
    }

    const permits = await Permit.find(query)
      .populate({
        path: "user",
        select: "name role",
        populate: {
          path: "employeeData",
          select: "fullName",
          populate: {
            path: "careerData",
            select: "bidangId",
            populate: {
              path: "bidangId",
              select: "name",
            },
          },
        },
      })
      .sort({ createdAt: -1 });

    const totalPermits = await Permit.countDocuments(query);
    const approved = await Permit.countDocuments({ ...query, status: "APPROVED" });
    const pending = await Permit.countDocuments({ ...query, status: "PENDING" });
    const rejected = await Permit.countDocuments({ ...query, status: "REJECTED" });

    res.render("permit/approvals", {
      title: "Otorisasi Perizinan",
      permits,
      currentRole: userRoleName,
      summary: { totalPermits, approved, pending, rejected },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const actionApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notesByApprover } = req.body;

    const approverRoleName = req.session.user.role;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status tidak valid" });
    }

    const permit = await Permit.findById(id).populate({
      path: "user",
      populate: { path: "roleId" },
    });

    if (!permit) {
      return res.status(404).json({ success: false, message: "Data pengajuan tidak ditemukan" });
    }

    const targetUserRoleName = permit.user.roleId.name;

    if (targetUserRoleName === "WAKIL_DIREKTUR") {
      if (approverRoleName !== "DIREKTUR_UTAMA") {
        return res.status(403).json({
          success: false,
          message: "Hanya Direktur Utama yang berhak memproses perizinan Wakil Direktur.",
        });
      }
    } else {
      if (approverRoleName !== "WAKIL_DIREKTUR") {
        return res.status(403).json({
          success: false,
          message: "Hanya Wakil Direktur yang berhak memproses perizinan karyawan.",
        });
      }
    }

    // 5. Update status
    permit.status = status;
    permit.approvedBy = req.session.user._id;
    permit.approvalDate = new Date();
    permit.notesByApprover = notesByApprover || null;

    await permit.save();
    res.redirect("/permit/incoming");
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
