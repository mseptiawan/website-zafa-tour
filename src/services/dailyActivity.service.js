import DailyActivity from "../models/DailyActivity.model.js";
import Employee from "../models/employee/Employee.model.js";
import UnitKpiMapping from "../models/kpi/UnitKpiMapping.model.js";
import KpiTemplateDetail from "../models/kpi/KpiTemplateDetail.model.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.js";
import Bidang from "../models/basic/Bidang.model.js";

/**
 * Mendapatkan KPI template berdasarkan unitId dan positionId pegawai
 */
export const getKpiDetails = async (unitId, positionId) => {
  if (!unitId || !positionId) return [];
  const mapping = await UnitKpiMapping.findOne({ unitId, positionId });
  if (!mapping) return [];
  return await KpiTemplateDetail.find({ kpiTemplateId: mapping.kpiTemplateId });
};

/**
 * Validasi apakah kpiTemplateId yang di-input sesuai dengan hak akses unit & posisi pegawai
 */
export const validateKpiAccess = async (employeeId, kpiTemplateId) => {
  if (!kpiTemplateId || kpiTemplateId === "lainnya") return null;

  const employee = await Employee.findById(employeeId).populate("careerData");
  if (!employee || !employee.careerData) throw new Error("Data karir tidak ditemukan.");

  const { unitId, positionId } = employee.careerData;
  const mapping = await UnitKpiMapping.findOne({ unitId, positionId });
  if (!mapping) throw new Error("Mapping KPI untuk posisi Anda tidak tersedia.");

  const isAllowed = await KpiTemplateDetail.findOne({
    _id: kpiTemplateId,
    kpiTemplateId: mapping.kpiTemplateId,
  });

  if (!isAllowed) throw new Error("Akses kode KPI template tidak valid.");
  return kpiTemplateId;
};

/**
 * Mendapatkan daftar log milik pegawai aktif pada tanggal tertentu
 */
export const findActivitiesByDate = async (employeeId, date) => {
  return await DailyActivity.find({ employeeId, activityDate: date })
    .sort({ createdAt: 1 })
    .populate({ path: "kpiTemplateId" });
};

/**
 * Mencatat aktivitas harian baru
 */
export const createActivity = async ({ employeeId, body }) => {
  const { activityDate, title, kpiTemplateId } = body;
  const finalKpiId = await validateKpiAccess(employeeId, kpiTemplateId);

  return await DailyActivity.create({
    employeeId,
    activityDate,
    title,
    kpiTemplateId: finalKpiId,
    status: "Pending",
  });
};

/**
 * Memperbarui aktivitas harian
 */
export const updateActivity = async ({ id, employeeId, body, file }) => {
  const { title, status, resultDescription, kpiTemplateId } = body;

  const activity = await DailyActivity.findOne({ _id: id, employeeId });
  if (!activity) throw new Error("Data catatan aktivitas tidak ditemukan.");

  let finalKpiId = activity.kpiTemplateId;
  if (kpiTemplateId) {
    finalKpiId = await validateKpiAccess(employeeId, kpiTemplateId);
  }

  const updateFields = {
    title,
    status,
    resultDescription: resultDescription || "",
    kpiTemplateId: finalKpiId,
    ...(file && { attachmentFile: file.filename }),
  };

  return await DailyActivity.findByIdAndUpdate(id, updateFields, {
    new: true,
    runValidators: true,
  });
};

/**
 * Menyalin tugas tertunda (Pending / In Progress) dari hari sebelumnya ke hari ini
 */
export const carryOverPendingTasks = async (employeeId, todayDate) => {
  const latestPendingTask = await DailyActivity.findOne({
    employeeId,
    activityDate: { $lt: todayDate },
    status: { $in: ["Pending", "In Progress"] },
  }).sort({ activityDate: -1 });

  if (!latestPendingTask) return { success: true, count: 0 };

  const sourceDate = latestPendingTask.activityDate;
  const delayedTasks = await DailyActivity.find({
    employeeId,
    activityDate: sourceDate,
    status: { $in: ["Pending", "In Progress"] },
  });

  const todayTasks = await DailyActivity.find({ employeeId, activityDate: todayDate });
  const todayTitlesSet = new Set(todayTasks.map((t) => t.title.toLowerCase().trim()));

  const carryOverData = delayedTasks
    .filter((task) => !todayTitlesSet.has(task.title.toLowerCase().trim()))
    .map((task) => ({
      employeeId,
      activityDate: todayDate,
      kpiTemplateId: task.kpiTemplateId,
      title: task.title,
      status: "Pending",
      resultDescription: "",
      attachmentFile: "",
    }));

  if (carryOverData.length > 0) {
    await DailyActivity.insertMany(carryOverData);
  }

  return { success: true, count: carryOverData.length, sourceDate };
};

/**
 * Memuat filter Bidang berdasarkan Role Atasan
 */
export const getReviewerBidangFilter = async (role, roleId) => {
  if (["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"].includes(role)) {
    return await Bidang.find().lean();
  }
  return await Bidang.find({ managerRoleId: roleId }).lean();
};

/**
 * Memproses data komparasi reviu aktivitas tim bawahan untuk API Dashboard Atasan
 */
export const generateReviewReport = async ({ role, roleId, query }) => {
  const { tanggal, bidangId } = query;
  let targetBidangIds = [];

  if (["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"].includes(role)) {
    if (bidangId) {
      targetBidangIds.push(bidangId);
    } else {
      const allBidang = await Bidang.find().select("_id");
      targetBidangIds = allBidang.map((b) => b._id);
    }
  } else {
    const managedBidangs = await Bidang.find({ managerRoleId: roleId }).select("_id");
    targetBidangIds = managedBidangs.map((b) => b._id);

    if (bidangId && targetBidangIds.some((id) => id.toString() === bidangId)) {
      targetBidangIds = [bidangId];
    }
  }

  const careers = await EmployeeCareer.find({ bidangId: { $in: targetBidangIds } })
    .populate({ path: "employee_id", populate: { path: "userId" } })
    .populate("bidangId", "name")
    .lean();

  const employeeIds = careers.map((c) => c.employee_id?._id).filter(Boolean);

  const logs = await DailyActivity.find({
    employeeId: { $in: employeeIds },
    activityDate: tanggal,
  }).populate("kpiTemplateId");

  return careers
    .map((car) => {
      const emp = car.employee_id;
      if (!emp) return null;

      const empLogs = logs.filter((log) => log.employeeId.toString() === emp._id.toString());
      const validTasks = empLogs.filter((t) => t.status !== "Canceled");
      const completedTasks = validTasks.filter((t) => t.status === "Completed");
      const pendingTasks = empLogs.filter((t) => ["Pending", "In Progress"].includes(t.status));

      const kpiTasksOnly = validTasks.filter((t) => t.kpiTemplateId !== null);
      const completedKpiTasks = kpiTasksOnly.filter((t) => t.status === "Completed");

      let kpiPercentage = 0;
      if (kpiTasksOnly.length > 0) {
        kpiPercentage = Math.round((completedKpiTasks.length / kpiTasksOnly.length) * 100);
      }

      return {
        _id: emp._id,
        fullName: emp.fullName,
        bidang: car.bidangId?.name || "Tanpa Bidang",
        totalTasks: empLogs.length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        kpiPercentage,
        logs: empLogs,
      };
    })
    .filter(Boolean);
};
