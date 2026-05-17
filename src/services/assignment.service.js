import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import Assignment from "../models/Assignment.js";
import Employee from "../models/Employee.js";

import { createAssignmentSchema } from "../validations/assignment/assignment.schema.js";

const create = async ({ body, file, userId }) => {
  return Assignment.create({
    ...body,
    employees: body.employees,
    createdBy: userId,
    attachment: file?.filename || null,
  });
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
  const skip = (page - 1) * limit;

  const totalData = await Assignment.countDocuments();

  const assignments = await Assignment.find()
    .populate([
      {
        path: "employees",
      },
      {
        path: "createdBy",
      },
    ])
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit);

  return {
    assignments,

    pagination: {
      page,
      limit,
      totalData,
      totalPages: Math.ceil(totalData / limit),
    },
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
