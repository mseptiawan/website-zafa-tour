import bcrypt from "bcrypt";

import User from "../../models/User.js";

import Role from "../../models/Role.js";
import Bidang from "../../models/Bidang.js";
import Unit from "../../models/Unit.js";

const userSeeder = async () => {
  await User.deleteMany();

  const hrRole = await Role.findOne({
    name: "HR",
  });

  const managerRole = await Role.findOne({
    name: "Manager",
  });

  const employeeRole = await Role.findOne({
    name: "Karyawan",
  });

  const marketingBidang = await Bidang.findOne({
    name: "Marketing",
  });

  const salesUnit = await Unit.findOne({
    name: "Sales",
  });

  const payrollUnit = await Unit.findOne({
    name: "Payroll",
  });

  const password = await bcrypt.hash("password123", 10);

  const manager = await User.create({
    employeeId: "EMP001",

    fullName: "Budi Santoso",

    email: "manager@zafa.com",

    password,

    phoneNumber: "081234567890",

    gender: "Laki-Laki",

    employmentStatus: "Tetap",

    roleId: managerRole._id,

    bidangId: marketingBidang._id,

    unitId: salesUnit._id,

    baseSalary: 10000000,
  });

  await User.insertMany([
    {
      employeeId: "EMP002",

      fullName: "HR Administrator",

      email: "hr@zafa.com",

      password,

      phoneNumber: "081111111111",

      gender: "Perempuan",

      employmentStatus: "Tetap",

      roleId: hrRole._id,

      bidangId: marketingBidang._id,

      unitId: payrollUnit._id,

      baseSalary: 8000000,
    },

    {
      employeeId: "EMP003",

      fullName: "Ahmad Fauzi",

      email: "employee@zafa.com",

      password,

      phoneNumber: "082222222222",

      gender: "Laki-Laki",

      employmentStatus: "Tetap",

      roleId: employeeRole._id,

      bidangId: marketingBidang._id,

      unitId: salesUnit._id,

      managerId: manager._id,

      baseSalary: 5000000,
    },
  ]);

  console.log("User seeded");
};

export default userSeeder;
