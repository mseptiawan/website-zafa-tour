import express from "express";
import roleMiddleware from "../middlewares/roleMiddleware.js";

import {
  listEmployee,
  formEmployee,
  createEmployee,
  detailEmployee,
} from "../controllers/employeeController.js";

const router = express.Router();

router.get("/", roleMiddleware(["HR"]), listEmployee);
router.get("/create", roleMiddleware(["HR"]), formEmployee);
router.post("/create", createEmployee);
router.get("/:id", detailEmployee);

export default router;
