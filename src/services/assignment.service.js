import Assignment from "../models/Assignment.js";
import Employee from "../models/Employee.js";
import { createAssignmentSchema } from "../validations/assignment/assignment.schema.js";

const create = async (req) => {
  const parsed = createAssignmentSchema.safeParse(req.body);

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

    createdBy: req.session.user._id,

    attachment: req.file ? req.file.filename : null,
  });
};

const getEmployees = () => {
  return Employee.find().sort({
    fullName: 1,
  });
};

const getMyAssignments = async (userId) => {
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

const getAllAssignments = async ({ page = 1, limit = 7 }) => {
  const skip = (page - 1) * limit;

  const totalData = await Assignment.countDocuments();

  const assignments = await Assignment.find()
    .populate("employees")
    .populate("createdBy")
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

const getById = (id) => {
  return Assignment.findById(id).populate("employees").populate("createdBy");
};

export default {
  create,
  getEmployees,
  getMyAssignments,
  getAllAssignments,
  getById,
};
