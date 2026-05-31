import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import Assignment from "../models/Assignment.model.js";
import Employee from "../models/employee/Employee.model.js";
import * as notificationService from "./notification.service.js";

export const findEmployees = async (excludeEmployeeId = null) => {
  const query = {};

  if (excludeEmployeeId) {
    query._id = { $ne: excludeEmployeeId };
  }

  return await Employee.find(query).sort({
    fullName: 1,
  });
};

export const create = async ({ body, file, userId }) => {
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
    const creator = await Employee.findById(userId);
    const creatorName = creator ? creator.name : "Pimpinan";

    if (employeeIds.length > 0 && employeeIds[0]) {
      const notifPromises = employeeIds.map((empId) => {
        return notificationService.createNotification({
          userId: empId,
          type: "assignment",
          title: "Penugasan Baru",
          text: `${creatorName} memberikan Anda tugas baru: "${body.title || "Tanpa Judul"}"`,
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

export const findMine = async ({ userId, page, limit }) => {
  const employee = await Employee.findOne({ userId });

  if (!employee) {
    return {
      data: [],
      meta: getPaginationMeta({
        page: 1,
        limit,
        total: 0,
      }),
    };
  }

  const {
    skip,
    limit: perPage,
    page: currentPage,
  } = getPagination({
    page,
    limit,
  });

  const filter = {
    employees: employee._id,
  };

  const total = await Assignment.countDocuments(filter);

  const data = await Assignment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage);

  return {
    data,
    meta: getPaginationMeta({
      page: currentPage,
      limit: perPage,
      total,
    }),
  };
};

export const findAll = async ({ page = 1, limit = 7 }) => {
  const {
    skip,
    limit: perPage,
    page: currentPage,
  } = getPagination({
    page,
    limit,
  });

  const total = await Assignment.countDocuments();

  const assignments = await Assignment.find()
    .populate([{ path: "employees" }, { path: "createdBy" }])
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(perPage);

  return {
    assignments,
    pagination: getPaginationMeta({
      page: currentPage,
      limit: perPage,
      total,
    }),
  };
};

export const findById = async (id) => {
  return await Assignment.findById(id).populate([
    {
      path: "employees",
    },
    {
      path: "createdBy",
    },
  ]);
};

export default {
  create,
  findAll,
  findById,
  findMine,
  findEmployees,
};
