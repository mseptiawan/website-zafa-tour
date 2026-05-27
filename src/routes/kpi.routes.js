import express from "express";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import {
  getAppraisalList,
  getAppraisalForm,
  getHistoryDetail,
  submitAppraisal,
  getHistoryList,
} from "../controllers/kpi.controller.js";

const router = express.Router();

router.get("/kpi/appraisal-list", roleMiddleware(["WAKIL_DIREKTUR"]), getAppraisalList);
router.get("/kpi/appraisal-form/:employeeId", roleMiddleware(["WAKIL_DIREKTUR"]), getAppraisalForm);
router.post("/kpi/appraisal-form/:employeeId", roleMiddleware(["WAKIL_DIREKTUR"]), submitAppraisal);

router.get("/kpi/history-list", getHistoryList);

router.get("/kpi/history-detail/:employeeId/:periode", getHistoryDetail);
export default router;
