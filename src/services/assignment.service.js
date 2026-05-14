import Assignment from "../models/Assignment.js";
import Employee from "../models/Employee.js";

import { createAssignmentSchema } from "../validations/assignment/assignment.schema.js";

const create = async ({ body, file, userId }) => {
  const parsed = createAssignmentSchema.safeParse(body);

  if (!parsed.success) {
    throw new Error(parsed.error.errors[0].message);
  }

  const { title, description, type, location, startDate, endDate, employees } = parsed.data;

  return Assignment.create({
    title,
    description,
    type,
    location,
    startDate,
    endDate,

    employees: Array.isArray(employees) ? employees : [employees],

    createdBy: userId,

    attachment: file ? file.filename : null,
  });
};

const findEmployees = () => {
  return Employee.find().sort({
    fullName: 1,
  });
};

const findMine = async (userId) => {
  const employee = await Employee.findOne({
    userId,
  });

  if (!employee) return [];

  return Assignment.find({
    employees: employee._id,
  }).sort({
    createdAt: -1,
  });
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
