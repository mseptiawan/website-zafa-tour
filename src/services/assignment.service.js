import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import Assignment from "../models/Assignment.js";
import Employee from "../models/employee/Employee.model.js";
import notificationService from "./notification.service.js";
import Notification from "../models/notification.model.js";
import { createAssignmentSchema } from "../validations/assignment/assignment.schema.js";

const create = async ({ body, file, userId }) => {
  const assignment = await Assignment.create({
    ...body,
    employees: body.employees,
    createdBy: userId,
    attachment: file?.filename || null,
  });

  try {
    const creator = await Employee.findById(userId);
    const creatorName = creator ? creator.name : "Pimpinan";

    let employeeIds = [];
    if (body.employees) {
      employeeIds = Array.isArray(body.employees) ? body.employees : [body.employees];
    }

    if (employeeIds.length > 0 && employeeIds[0]) {
      const notifPromises = employeeIds.map((empId) => {
        return notificationService.createNotification({
          userId: empId,
          type: "assignment",
          title: "Penugasan Baru",
          text: `${creatorName} memberikan Anda tugas baru: "${body.title || body.taskName || "Tanpa Judul"}"`,
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

const findEmployees = () => {
  return Employee.find().sort({
    fullName: 1,
  });
};

const findMine = async ({ userId, page, limit }) => {
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

const findAll = async ({ page = 1, limit = 7 }) => {
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

const findById = (id) => {
  return Assignment.findById(id).populate([
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
