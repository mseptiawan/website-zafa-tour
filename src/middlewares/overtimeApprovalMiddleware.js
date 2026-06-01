import Overtime from "../models/Overtime.model.js";
import Employee from "../models/employee/Employee.model.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.model.js";
import Bidang from "../models/basic/Bidang.model.js";

export const overtimeApprovalMiddleware = async (req, res, next) => {
  try {
    const overtime = await Overtime.findById(req.params.id);

    if (!overtime) {
      return res.status(404).send("Data lembur tidak ditemukan");
    }

    const employee = await Employee.findOne({
      userId: overtime.userId,
    });

    if (!employee) {
      return res.status(404).send("Data pegawai tidak ditemukan");
    }

    const career = await EmployeeCareer.findOne({
      employee_id: employee._id,
    });

    if (!career) {
      return res.status(404).send("Data karir pegawai tidak ditemukan");
    }

    const bidang = await Bidang.findById(career.bidangId);

    if (!bidang) {
      return res.status(404).send("Bidang pegawai tidak ditemukan");
    }

    if (req.session.user.roleId.toString() !== bidang.managerRoleId.toString()) {
      return res.status(403).send("Tidak memiliki hak approval");
    }

    req.overtime = overtime;

    next();
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.message);
  }
};
