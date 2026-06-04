import express from "express";
import {
  getAllEmployeesWeb,
  formEmployeeWeb,
  editEmployeeWeb,
  getEmployeeDetailWeb,
  editProfileMandiriWeb,
} from "../../controllers/employee.controller.js";

const router = express.Router();
router.get("/", getAllEmployeesWeb);
router.get("/create", formEmployeeWeb);
router.get("/edit/:id", editEmployeeWeb);
router.get("/detail/:id", getEmployeeDetailWeb);
router.get("/my-profile/edit", editProfileMandiriWeb);
export default router;
