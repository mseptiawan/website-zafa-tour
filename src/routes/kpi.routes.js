import express from "express";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import {
  indexAppraisal,
  createAppraisal,
  storeAppraisal,
  indexHistory,
  showHistory,
  showMyHistory,
} from "../controllers/kpi.controller.js";

const router = express.Router();

router.get("/appraisals", roleMiddleware(["WAKIL_DIREKTUR"]), indexAppraisal);
router.get("/appraisals/form/:employeeId", roleMiddleware(["WAKIL_DIREKTUR"]), createAppraisal);
router.post("/appraisals/:employeeId", roleMiddleware(["WAKIL_DIREKTUR"]), storeAppraisal);
router.get("/histories", indexHistory);
router.get("/histories/:employeeId/:periode", showHistory);

router.get("/my-histories", showMyHistory);

export default router;
