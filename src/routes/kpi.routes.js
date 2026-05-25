import express from "express";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import {
  kpiEmployeeList,
  kpiForm,
  getKpiDetail,
  submitKpi,
  kpiManage,
  getKpiList,
  kpiReport,
} from "../controllers/kpiController.js";

const router = express.Router();

router.get("/kpi/input", roleMiddleware(["HR"]), kpiEmployeeList);
router.get("/kpi/input/:employeeId", roleMiddleware(["HR"]), kpiForm);
router.post("/kpi/input/:employeeId", roleMiddleware(["HR"]), submitKpi);

router.get("/kpi/manage", roleMiddleware(["HR"]), kpiManage);
router.get("/kpi/report", roleMiddleware(["HR"]), kpiReport);
router.get("/kpi/list", getKpiList);

// Detail KPI Pegawai (Lengkap)
router.get("/kpi/detail/:employeeId/:periode", getKpiDetail);
export default router;
