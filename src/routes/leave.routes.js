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
  approveLeave,
  rejectLeave,
  getHolidaysPage,
  createHoliday,
  deleteHoliday,
} from "../controllers/leaveController.js";

const router = express.Router();

router.get("/leave/apply", authMiddleware, showApplyLeave);
router.post("/leave/apply", authMiddleware, uploadFile.single("attachments"), applyLeave);
router.get("/leave/my-history", authMiddleware, myLeave);
router.get("/leave/detail/:id", authMiddleware, getLeaveDetail);
router.get("/leave/edit/:id", authMiddleware, editLeave);
router.post("/leave/edit/:id", authMiddleware, uploadFile.single("attachments"), updateLeave);
router.post("/leave/cancel-pending/:id", authMiddleware, cancelPendingLeave);
router.post("/leave/request-cancel/:id", authMiddleware, requestCancelApprovedLeave);
router.get("/leave/resubmit/:id", authMiddleware, showResubmitLeave);

router.get("/leave/my-delegations", authMiddleware, myDelegations);
router.post("/leave/delegation/approve/:id", authMiddleware, approveDelegation);
router.post("/leave/delegation/reject/:id", authMiddleware, rejectDelegation);

router.get("/leave/manage-requests", authMiddleware, getManageLeavePage);

// Route untuk menampilkan halaman kalender
router.get("/leave/manage-calendar", getHolidaysPage);

// SOLUSI ERROR: Route POST untuk handle submit form tambah hari libur
router.post("/leave/manage-calendar/create", createHoliday);

// Route DELETE untuk hapus hari libur
router.delete("/leave/manage-calendar/delete/:id", deleteHoliday);

// router.get("/leave/approvals", authMiddleware, showApprovals);
router.post("/leave/approval/approve/:id", authMiddleware, approveLeave);

router.post("/leave/approval/reject/:id", authMiddleware, rejectLeave);

export default router;
