import Holiday from "../models/calender/Holiday.model.js";
import Leave from "../models/leave/Leave.model.js";
import LeaveApproval from "../models/leave/LeaveApproval.model.js";
import LeaveBalance from "../models/leave/LeaveBalance.model.js";

// Helper internal untuk menghitung selisih hari absolut
const calculateTotalDays = (startDate, endDate) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = endDate ? new Date(endDate) : new Date(startDate);
  end.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// Helper internal untuk menentukan status potong cuti
const determineDeductLeave = (type, isDeductLeave) => {
  if (type === "COMPANY") return true;
  if (type === "NATIONAL") return false;
  if (type === "RELIGIOUS") return isDeductLeave === "true" || isDeductLeave === true;
  return false;
};

export const getHolidaysPageData = async (user, selectedYear) => {
  let query = {};

  if (["MANAGER_ADMINISTRASI", "WAKIL_DIREKTUR", "DIREKTUR_UTAMA"].includes(user.role)) {
    const structuralApprovals = await LeaveApproval.find({ approverId: user._id });
    const leaveIds = structuralApprovals.map((app) => app.leaveId);
    query = { _id: { $in: leaveIds } };
  }

  const allLeaves = await Leave.find(query)
    .populate("leaveTypeId", "name")
    .populate({ path: "userId", populate: { path: "employeeData", select: "fullName" } })
    .sort({ createdAt: -1 });

  const activeLeaves = allLeaves.filter((leave) => leave.status === "PENDING");
  const historyLeaves = allLeaves.filter((leave) => leave.status !== "PENDING");

  const holidays = await Holiday.find({
    $or: [{ year: selectedYear }, { isRecurring: true }],
  }).sort({ date: 1 });

  return { activeLeaves, historyLeaves, holidays };
};

export const createHolidayService = async (body) => {
  const { name, date, endDate, type, isDeductLeave, description } = body;
  const parsedDate = new Date(date);
  const year = parsedDate.getFullYear();

  const finalIsDeductLeave = determineDeductLeave(type, isDeductLeave);

  await Holiday.create({
    name,
    date: parsedDate,
    endDate: endDate ? new Date(endDate) : null,
    type,
    isDeductLeave: finalIsDeductLeave,
    description,
    year,
  });

  if (finalIsDeductLeave) {
    await LeaveBalance.updateMany({ year: year }, { $inc: { remaining: -1, used: 1 } });
  }
};

export const updateHolidayService = async (id, body) => {
  const { name, date, endDate, type, isDeductLeave, description } = body;

  const oldHoliday = await Holiday.findById(id);
  if (!oldHoliday) throw new Error("Agenda tidak ditemukan.");

  const parsedStartDate = new Date(date);
  parsedStartDate.setHours(0, 0, 0, 0);
  const year = parsedStartDate.getFullYear();

  const parsedEndDate = endDate ? new Date(endDate) : new Date(date);
  parsedEndDate.setHours(0, 0, 0, 0);

  const totalDaysNew = calculateTotalDays(parsedStartDate, parsedEndDate);
  const totalDaysOld = calculateTotalDays(oldHoliday.date, oldHoliday.endDate);
  const finalIsDeductLeave = determineDeductLeave(type, isDeductLeave);

  if (oldHoliday.isActive) {
    const wasDeduct = oldHoliday.isDeductLeave === true;
    const isNowDeduct = finalIsDeductLeave === true;

    if (!wasDeduct && isNowDeduct) {
      await LeaveBalance.updateMany(
        { year: year },
        { $inc: { remaining: -totalDaysNew, used: totalDaysNew } }
      );
    } else if (wasDeduct && !isNowDeduct) {
      await LeaveBalance.updateMany(
        { year: oldHoliday.year },
        { $inc: { remaining: totalDaysOld, used: -totalDaysOld } }
      );
    } else if (wasDeduct && isNowDeduct) {
      const dayDifference = totalDaysOld - totalDaysNew;
      if (dayDifference !== 0) {
        await LeaveBalance.updateMany(
          { year: year },
          { $inc: { remaining: dayDifference, used: -dayDifference } }
        );
      }
    }
  }

  await Holiday.findByIdAndUpdate(id, {
    name,
    date: parsedStartDate,
    endDate: endDate ? parsedEndDate : null,
    type,
    isDeductLeave: finalIsDeductLeave,
    description,
    year,
  });
};

export const toggleHolidayStatusService = async (id) => {
  const holiday = await Holiday.findById(id);
  if (!holiday) throw new Error("Data tidak ditemukan.");

  const totalDays = calculateTotalDays(holiday.date, holiday.endDate);
  const targetStatus = !holiday.isActive;

  if (holiday.isDeductLeave === true) {
    if (holiday.isActive === true && targetStatus === false) {
      await LeaveBalance.updateMany(
        { year: holiday.year },
        { $inc: { remaining: totalDays, used: -totalDays } }
      );
    } else if (holiday.isActive === false && targetStatus === true) {
      await LeaveBalance.updateMany(
        { year: holiday.year },
        { $inc: { remaining: -totalDays, used: totalDays } }
      );
    }
  }

  holiday.isActive = targetStatus;
  await holiday.save();

  return holiday.isActive;
};
