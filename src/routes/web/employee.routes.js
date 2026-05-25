import express from "express";
import {
  getAllEmployeesWeb,
  formEmployeeWeb,
  editEmployeeWeb,
} from "../../controllers/employee.controller.js";

const router = express.Router();
router.get("/", getAllEmployeesWeb);
router.get("/create", formEmployeeWeb);
router.get("/edit/:id", editEmployeeWeb);
export default router;
