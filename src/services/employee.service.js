import Employee from "../models/employee/Employee.model.js";
import User from "../models/basic/User.js";
import Termination from "../models/Termination.js";
import Role from "../models/basic/Role.js";
import Position from "../models/basic/Position.js";
import Unit from "../models/basic/Unit.js";
import Bidang from "../models/basic/Bidang.js";
import bcrypt from "bcrypt";

export const EmployeeService = {
  findAllEmployees: async () => {
    const employeesData = await Employee.find()
      .populate("userId")
      .populate("positionId")
      .populate("bidangId")
      .populate("unitId");

    const approvedTerminations = await Termination.find({ status: "Approved" }).populate(
      "approvedBy",
      "username"
    );

    return employeesData.map((emp) => {
      const empObj = emp.toObject();
      const termInfo = approvedTerminations.find(
        (t) => t.employeeId.toString() === emp._id.toString()
      );
      if (termInfo) {
        empObj.terminationInfo = {
          reason: termInfo.reason,
          approvedBy: termInfo.approvedBy?.username || "System",
          date: new Date(termInfo.updatedAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        };
      }
      return empObj;
    });
  },

  getFormData: async () => {
    const [positions, units, bidang] = await Promise.all([
      Position.find(),
      Unit.find(),
      Bidang.find(),
    ]);
    return { positions, units, bidang };
  },
  createNewEmployee: async (data) => {
    let role = await Role.findOne({ name: "STAFF" });
    if (!role) {
      role = await Role.create({ name: "STAFF" });
    }

    const count = await Employee.countDocuments();
    const nextOrder = (count + 1).toString().padStart(3, "0");
    const employeeIdNumber = `EMP-${nextOrder}`;

    const username = data.fullName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const password = await bcrypt.hash("zafasecret", 10);

    const user = await User.create({ username, password, roleId: role._id });

    return await Employee.create({
      userId: user._id,
      employeeIdNumber: employeeIdNumber,
      fullName: data.fullName,
      positionId: data.positionId,
      unitId: data.unitId || null,
      bidangId: data.bidangId || null,
      gender: data.gender,
      phoneNumber: data.phoneNumber,
      address: data.address,
      employmentStatus: data.employmentStatus,
      joinDate: new Date(),
    });
  },

  findEmployeeById: async (id) => {
    return await Employee.findById(id)
      .populate("userId")
      .populate("positionId")
      .populate("unitId")
      .populate("bidangId");
  },

  getReferenceData: async () => {
    const [positions, units, bidangs] = await Promise.all([
      Position.find(),
      Unit.find(),
      Bidang.find(),
    ]);
    return { positions, units, bidangs };
  },

  createTermination: async (data, filePath) => {
    const newTermination = new Termination({
      employeeId: data.employeeId,
      reason: data.reason,
      documentPath: filePath,
      status: "Waiting",
    });
    return await newTermination.save();
  },

  updateEmployeeById: async (id, data, fileName) => {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new AppError("Karyawan tidak ditemukan", 404);
    }
    Object.assign(employee, {
      fullName: data.fullName,
      positionId: data.positionId,
      unitId: data.unitId || null,
      bidangId: data.bidangId || null,
      employmentStatus: data.employmentStatus,
      gender: data.gender,
      phoneNumber: data.phoneNumber,
      address: data.address,
      baseSalary: Number(data.baseSalary) || 0,
    });

    if (fileName) employee.profilePhoto = fileName;
    return await employee.save();
  },
};
