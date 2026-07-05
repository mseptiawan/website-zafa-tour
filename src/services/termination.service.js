import Termination from "../models/Termination.model.js";
import User from "../models/basic/User.model.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.js";

export const getApprovalWorkspaceData = async () => {
  const pendingList = await Termination.find({ status: "Waiting" })
    .populate({
      path: "employeeId",
      populate: { path: "userId", select: "username email" },
    })
    .sort({ createdAt: -1 })
    .lean();

  const historyList = await Termination.find({ status: "Approved" })
    .populate({
      path: "employeeId",
      populate: { path: "userId", select: "username email" },
    })
    .populate({
      path: "approvedBy",
      select: "username",
      populate: {
        path: "employeeData",
        select: "fullName",
      },
    })
    .sort({ updatedAt: -1 })
    .lean();

  const injectCareerData = async (list) => {
    return await Promise.all(
      list.map(async (item) => {
        if (item.employeeId?._id) {
          const career = await EmployeeCareer.findOne({ employee_id: item.employeeId._id })
            .populate("bidangId")
            .populate("positionId")
            .lean();

          item.employeeId.careerData = career;
        }
        return item;
      })
    );
  };

  const enrichedPending = await injectCareerData(pendingList);
  const enrichedHistory = await injectCareerData(historyList);

  const stats = {
    totalPending: enrichedPending.length,
    totalApproved: enrichedHistory.length,
  };

  return {
    pendingList: enrichedPending,
    historyList: enrichedHistory,
    stats,
  };
};

export const executeApprovePHK = async (terminationId, adminUserId) => {
  const termination = await Termination.findById(terminationId).populate("employeeId");
  if (!termination) {
    const err = new Error("Data pengajuan PHK tidak ditemukan.");
    err.statusCode = 404;
    throw err;
  }

  if (termination.status !== "Waiting") {
    const err = new Error("Pengajuan ini sudah diproses sebelumnya.");
    err.statusCode = 400;
    throw err;
  }

  termination.status = "Approved";
  termination.approvedBy = adminUserId;
  await termination.save();

  if (termination.employeeId?.userId) {
    await User.findByIdAndUpdate(termination.employeeId.userId, {
      status: "Inactive",
    });
  }

  return termination;
};
