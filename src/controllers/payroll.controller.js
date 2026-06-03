import * as payrollService from "../services/payroll.service.js";
import Payroll from "../models/payroll/Payroll.model.js";
import { runPayroll } from "../services/payrollRun.service.js";
import { getOvertimeSummary } from "../services/overtimeSummary.service.js";
import SalaryComponent from "../models/payroll/SalaryComponent.model.js";
import EmployeeAllowance from "../models/payroll/EmployeeAllowance.model.js";

export const renderPayrollPage = async (req, res) => {
  try {
    const { employees, components, savedAllowances } = await payrollService.getPayrollData();

    const now = new Date();

    const currentMonth = now.toLocaleString("id-ID", {
      month: "long",
      year: "numeric",
    });

    const payrollPeriod = {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };

    res.render("payroll/index", {
      title: "Manajemen Payroll",
      user: req.user,
      employees,
      components,
      savedAllowances,
      currentMonth,
      payrollPeriod,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
export const savePayroll = async (req, res) => {
  try {
    const { employeeId, date } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee wajib dipilih",
      });
    }

    const periodDate = new Date(date || Date.now());
    const period = getPayrollPeriod(periodDate);

    const overtime = await getOvertimeSummary(employeeId, periodDate);

    const payrollData = await payrollService.buildPayroll({
      employeeId,
      date: periodDate,
      overtime,
    });

    const saved = await Payroll.findOneAndUpdate(
      {
        employeeId,
        periodMonth: period.id,
      },
      payrollData,
      { upsert: true, new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: "Payroll berhasil dihitung",
      data: saved,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const saveEmployeeAllowances = async (req, res) => {
  try {
    const { employeeId, allowances } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "ID Pegawai wajib diisi.",
      });
    }

    const masterComponents = await SalaryComponent.find({ isActive: true });

    const componentMap = {};
    const categoryMap = {};

    masterComponents.forEach((comp) => {
      componentMap[comp.name] = comp._id;
      categoryMap[comp._id.toString()] = comp.category;
    });

    const bulkOperations = [];
    const incomingComponentIds = [];
    const categoriesToUpdate = new Set();

    if (allowances && allowances.length > 0) {
      for (const item of allowances) {
        const componentId = componentMap[item.componentName];
        if (!componentId) continue;

        incomingComponentIds.push(componentId);

        const category = categoryMap[componentId.toString()];
        if (category) categoriesToUpdate.add(category);

        bulkOperations.push({
          updateOne: {
            filter: { employeeId, componentId },
            update: {
              $set: {
                amount: parseFloat(item.amount) || 0,
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (categoriesToUpdate.size > 0) {
      const targetComponentIds = masterComponents
        .filter((c) => categoriesToUpdate.has(c.category))
        .map((c) => c._id);

      await EmployeeAllowance.deleteMany({
        employeeId,
        componentId: {
          $in: targetComponentIds,
          $nin: incomingComponentIds,
        },
      });
    } else {
      await EmployeeAllowance.deleteMany({ employeeId });
    }

    if (bulkOperations.length > 0) {
      await EmployeeAllowance.bulkWrite(bulkOperations);
    }

    return res.status(200).json({
      success: true,
      message: "Seluruh komponen payroll berhasil diperbarui!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
