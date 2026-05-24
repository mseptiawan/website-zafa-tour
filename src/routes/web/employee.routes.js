import express from "express";
import {
  getAllEmployeesWeb,
  formEmployeeWeb,
  detailEmployeeWeb,
} from "../../controllers/employee.controller.js";

const router = express.Router();
router.get("/", getAllEmployeesWeb);
router.get("/create", formEmployeeWeb);
router.get("/edit/:id", detailEmployeeWeb);
export default router;
