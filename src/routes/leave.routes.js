import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import {
  showApplyLeave,
  applyLeave,
  myLeave,
  getLeaveDetail,
  editLeave,
  updateLeave,
  cancelPendingLeave,
  requestCancelApprovedLeave,
  showResubmitLeave,
  myDelegations,
  getManageLeavePage,
  approveDelegation,
  rejectDelegation,
  showApprovals,
  generateOrResetLeaveBalance,
  approveLeave,
  rejectLeave,
  getHolidaysPage,
  calculateLeaveDays,
  updateHoliday,
  toggleHolidayStatus,
  createHoliday,
  deleteHoliday,
} from "../controllers/leave.controller.js";

const router = express.Router();

router.get("/new", authMiddleware, showApplyLeave);
router.post("/", authMiddleware, uploadFile.single("attachments"), applyLeave);
router.get("/me", authMiddleware, myLeave);
router.get("/detail/:id", authMiddleware, getLeaveDetail);
router.get("/edit/:id", authMiddleware, editLeave);
router.post("/update/:id", authMiddleware, uploadFile.single("attachments"), updateLeave);
router.post("/cancel-pending/:id", authMiddleware, cancelPendingLeave);
router.post("/request-cancel/:id", authMiddleware, requestCancelApprovedLeave);
router.get("/resubmit/:id", authMiddleware, showResubmitLeave);

router.get("/my-delegations", authMiddleware, myDelegations);
router.post("/delegation/approve/:id", authMiddleware, approveDelegation);
router.post("/delegation/reject/:id", authMiddleware, rejectDelegation);

router.get("/manage-requests", authMiddleware, getManageLeavePage);

router.get("/api/calculate-days", authMiddleware, calculateLeaveDays);

router.get("/manage-calendar", getHolidaysPage);

router.post("/manage-calendar/create", createHoliday);

router.patch("/manage-calendar/toggle/:id", toggleHolidayStatus);

router.post("/manage-calendar/update/:id", updateHoliday);
router.post("/manage-requests/generate-balances", generateOrResetLeaveBalance);

router.post("/approval/approve/:id", authMiddleware, approveLeave);

router.post("/approval/reject/:id", authMiddleware, rejectLeave);

export default router;
