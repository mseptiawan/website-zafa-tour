import express from "express";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import {
  getAppraisalList,
  getAppraisalForm,
  getHistoryDetail,
  submitAppraisal,
  getHistoryList,
  getMyKpiHistory,
} from "../controllers/kpi.controller.js";

const router = express.Router();

router.get("/appraisal-list", roleMiddleware(["WAKIL_DIREKTUR"]), getAppraisalList);
router.get("/appraisal-form/:employeeId", roleMiddleware(["WAKIL_DIREKTUR"]), getAppraisalForm);
router.post("/appraisal-form/:employeeId", roleMiddleware(["WAKIL_DIREKTUR"]), submitAppraisal);

router.get("/history-list", getHistoryList);

router.get("/history-detail/:employeeId/:periode", getHistoryDetail);

router.get("/my-history", getMyKpiHistory);

export default router;
