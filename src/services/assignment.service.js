import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import Assignment from "../models/Assignment.model.js";
import Employee from "../models/employee/Employee.model.js";
import * as notificationService from "./notification.service.js";

export const findEmployees = async (excludeEmployeeId = null) => {
  const query = {};

  if (excludeEmployeeId) {
    query._id = { $ne: excludeEmployeeId };
  }

  return await Employee.find(query).sort({ fullName: 1 });
};

export const create = async ({ body, file, userId, creatorName }) => {
  let employeeIds = [];
  if (body.employees) {
    employeeIds = Array.isArray(body.employees) ? body.employees : [body.employees];
  }

  const assignment = await Assignment.create({
    title: body.title,
    description: body.description,
    type: body.type,
    location: body.location,
    startDate: body.startDate,
    endDate: body.endDate,
    employees: employeeIds,
    createdBy: userId,
    attachment: file?.filename || null,
  });

  try {
    const senderName = creatorName || "Pimpinan";

    if (employeeIds.length > 0 && employeeIds[0]) {
      const notifPromises = employeeIds.map((empId) => {
        return notificationService.createNotification({
          userId: empId,
          type: "assignment",
          title: "Penugasan Baru",
          text: `${senderName} memberikan Anda tugas baru: "${body.title || "Tanpa Judul"}"`,
          module: "assignment",
          referenceId: assignment._id,
        });
      });

      await Promise.all(notifPromises);
    }
  } catch (notifError) {
    console.error("Notification Error on Assignment Creation:", notifError);
  }

  return assignment;
};

export const findMine = async ({ employeeId, page, limit }) => {
  if (!employeeId) {
    return { data: [], meta: getPaginationMeta({ page: 1, limit: 10, total: 0 }) };
  }

  const paginationArgs = getPagination({ page, limit });
  const filter = { employees: employeeId };
  const total = await Assignment.countDocuments(filter);

  const data = await Assignment.find(filter)
    .populate("createdBy", "username email")
    .sort({ createdAt: -1 })
    .skip(paginationArgs.skip)
    .limit(paginationArgs.limit);

  return {
    data,
    meta: getPaginationMeta({
      page: paginationArgs.page,
      limit: paginationArgs.limit,
      total,
    }),
  };
};

export const findAll = async ({ page = 1, limit = 7, currentUser }) => {
  const paginationArgs = getPagination({ page, limit });
  let filter = {};
  const role = currentUser?.role?.toUpperCase();

  if (["MANAGER_ADMINISTRASI", "MANAGER_HAJI_UMRAH", "MANAGER_KEUANGAN"].includes(role)) {
    filter = { createdBy: currentUser._id };
  }

  const total = await Assignment.countDocuments(filter);

  const assignments = await Assignment.find(filter)
    .populate([{ path: "employees" }, { path: "createdBy" }])
    .sort({ createdAt: -1 })
    .skip(paginationArgs.skip)
    .limit(paginationArgs.limit);

  return {
    assignments,
    meta: getPaginationMeta({
      page: paginationArgs.page,
      limit: paginationArgs.limit,
      total,
    }),
  };
};

export const findById = async (id) => {
  return await Assignment.findById(id).populate([{ path: "employees" }, { path: "createdBy" }]);
};
