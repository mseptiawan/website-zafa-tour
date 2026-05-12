import express from "express";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import {
  formCorrection,
  submitCorrection,
  myCorrections,
  allCorrections,
  updateStatus,
} from "../controllers/attendanceCorrectionController.js";

import {
  showLogin,
  login,
  dashboard,
  logout,
  showForgotPassword,
  requestPasswordReset,
  showResetPasswordPage,
  handleResetPassword,
  resetPassword,
} from "../controllers/authController.js";
import { uploadPhoto } from "../middlewares/uploadPhoto.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import {
  showApplyLeave,
  applyLeave,
  myLeave,
  managerApprovalPage,
  hrApprovalPage,
  pimpinanApprovalPage,
  allLeavePage,
  detailLeave,
  approveManager,
  approveHR,
  approvePimpinan,
  rejectLeave,
} from "../controllers/leaveController.js";
import {
  showApplyOvertime,
  applyOvertime,
  myOvertime,
  approvalOvertimePage,
  approveManagerOvertime,
  detailOvertime,
  rejectOvertime,
  approvalOvertimeHistory,
} from "../controllers/overtimeController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  kpiEmployeeList,
  kpiForm,
  submitKpi,
  kpiManage,
  kpiReport,
} from "../controllers/kpiController.js";
import {
  index,
  checkIn,
  allAttendance,
  checkOut,
  editForm,
  manualForm,
  createManual,
  updateAttendance,
  getCorrectionDetail,
  history,
} from "../controllers/attendanceController.js";
import {
  formRequest,
  myTrips,
  tripDetail,
  createTrip,
  approveManagerTrip,
  allTrips,
  approveDirector,
} from "../controllers/tripController.js";
import { salesReport, visitForm, storeVisit } from "../controllers/salesController.js";
import {
  formAssignment,
  createAssignment,
  myAssignments,
  allAssignments,
  assignmentDetail,
} from "../controllers/assignmentController.js";
import {
  formAnnouncement,
  createAnnouncement,
  allAnnouncements,
  detailAnnouncement,
  publishAnnouncement,
} from "../controllers/announcementController.js";
import { getReportPage, exportExcel, exportPDF } from "../controllers/overtimeReportController.js";
import {
  formExpense,
  createExpense,
  myExpenses,
  allExpenses,
  approvalManagerExpense,
  approveManagerExpense,
  financeExpensePage,
  payExpense,
} from "../controllers/expenseController.js";
const router = express.Router();

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/
router.get("/", showLogin);
router.post("/login", login);
router.get("/logout", logout);

// forgot password
router.get("/forgot-password", showForgotPassword);
router.post("/forgot-password", requestPasswordReset);

// reset password page (via link)
router.get("/reset-password", showResetPasswordPage);
router.post("/reset-password", handleResetPassword);
/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/
router.get("/dashboard", authMiddleware, dashboard);

/*
|--------------------------------------------------------------------------
| LEAVE MODULE
|--------------------------------------------------------------------------
*/
router.get("/leave/apply", authMiddleware, showApplyLeave);

router.post("/leave/apply", authMiddleware, uploadFile.single("file"), applyLeave);

router.get("/leave/my", authMiddleware, myLeave);

router.get(
  "/leave/approval/manager",
  authMiddleware,
  roleMiddleware("MANAGER"),
  managerApprovalPage
);

router.get("/leave/approval/hr", authMiddleware, roleMiddleware("HR"), hrApprovalPage);

router.get(
  "/leave/approval/pimpinan",
  authMiddleware,
  roleMiddleware("PIMPINAN"),
  pimpinanApprovalPage
);

router.post(
  "/leave/approval/:id/manager",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  approveManager
);

router.post("/leave/approval/:id/hr", authMiddleware, roleMiddleware(["HR"]), approveHR);
router.post(
  "/leave/approval/:id/pimpinan",
  authMiddleware,
  roleMiddleware(["PIMPINAN"]),
  approvePimpinan
);
router.post(
  "/leave/approval/:id/reject",
  authMiddleware,
  roleMiddleware(["HR", "MANAGER", "PIMPINAN"]),
  rejectLeave
);
router.get("/leave/all", roleMiddleware(["HR", "MANAGER", "PIMPINAN"]), allLeavePage);

router.get("/leave/:id", authMiddleware, detailLeave);

// ==========================
// OVERTIME
// ==========================

router.get("/overtime/apply", authMiddleware, showApplyOvertime);

router.post("/overtime/apply", authMiddleware, uploadFile.single("proofFile"), applyOvertime);

router.get("/overtime/my", authMiddleware, myOvertime);
router.get(
  "/overtime/approval/history",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  approvalOvertimeHistory
);
router.get(
  "/overtime/approval",
  authMiddleware,
  roleMiddleware(["HR", "MANAGER"]),
  approvalOvertimePage
);

router.get("/overtime/:id", authMiddleware, detailOvertime);

router.post(
  "/overtime/approval/:id/manager",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  approveManagerOvertime
);

router.post(
  "/overtime/approval/:id/reject",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  rejectOvertime
);

router.get("/report/overtime", authMiddleware, getReportPage);
router.get("/report/overtime/export/excel", authMiddleware, exportExcel);
router.get("/report/export/pdf", authMiddleware, exportPDF);

router.get("/kpi/input", roleMiddleware(["HR"]), kpiEmployeeList);

router.get("/kpi/input/:employeeId", roleMiddleware(["HR"]), kpiForm);

router.post("/kpi/input/:employeeId", roleMiddleware(["HR"]), submitKpi);

router.get("/kpi/manage", roleMiddleware(["HR"]), kpiManage);

router.get("/kpi/report", roleMiddleware(["HR"]), kpiReport);
router.get("/attendance", index);
router.get("/attendance/history", history);

router.post("/attendance/checkin", uploadPhoto.single("photo"), checkIn);
router.post("/attendance/checkout", checkOut);
router.get("/attendance/all", roleMiddleware(["HR"]), allAttendance);
router.get("/attendance/edit/:id", roleMiddleware(["HR"]), editForm);
router.post("/attendance/edit/:id", roleMiddleware(["HR"]), updateAttendance);

router.get("/attendance/create-manual", roleMiddleware(["HR"]), manualForm);
router.post("/attendance/create-manual", roleMiddleware(["HR"]), createManual);
router.get("/attendance/correction", formCorrection);
router.post("/attendance/correction", submitCorrection);
router.get("/attendance/correction/history", myCorrections);

/**
 * ADMIN
 */
router.get("/attendance/approval-correction", roleMiddleware(["HR"]), allCorrections);
router.get("/attendance/correction/:id", authMiddleware, getCorrectionDetail);
router.get("/attendance/correction/:id/:status", roleMiddleware(["HR"]), updateStatus);

// form pengajuan dinas luar
router.get("/trip/request", authMiddleware, formRequest);
router.post("/trip/request", authMiddleware, createTrip);

// perjalanan saya (user login)
router.get("/trip/my", authMiddleware, myTrips);

// detail trip

/*
|--------------------------------------------------------------------------
| APPROVAL FLOW (HR / MANAGER / DIRECTOR)
|--------------------------------------------------------------------------
*/
router.get("/trip/all", roleMiddleware(["HR", "MANAGER", "PIMPINAN"]), allTrips);
// approval manager
router.post(
  "/trip/:id/approve/manager",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  approveManagerTrip
);

// approval director
router.post(
  "/trip/:id/approve/director",
  authMiddleware,
  roleMiddleware(["PIMPINAN", "HR"]),
  approveDirector
);
router.get("/trip/detail/:id", authMiddleware, tripDetail);
/*
|--------------------------------------------------------------------------
| SALES VISIT (PLACEHOLDER - nanti kita isi)
|--------------------------------------------------------------------------
*/
router.get("/sales/visit", authMiddleware, visitForm);
router.post(
  "/sales/visit",
  authMiddleware,
  uploadPhoto.array("photo", 5), // bisa banyak foto
  storeVisit
);

router.get(
  "/sales/report",
  authMiddleware,
  roleMiddleware(["HR", "MANAGER", "PIMPINAN"]),
  salesReport
);
router.get("/assignment/create", authMiddleware, formAssignment);
router.post(
  "/assignment/create",
  authMiddleware,
  uploadFile.single("attachment"),
  roleMiddleware(["PIMPINAN"]),
  createAssignment
);

router.get("/assignment/my", authMiddleware, myAssignments);

router.get("/assignment/all", authMiddleware, roleMiddleware(["PIMPINAN"]), allAssignments);

router.get("/assignment/:id", authMiddleware, assignmentDetail);
router.get("/announcement/create", authMiddleware, formAnnouncement);

router.post(
  "/announcement/create",
  authMiddleware,
  uploadFile.single("attachment"),
  createAnnouncement
);

router.get("/announcement/all", authMiddleware, allAnnouncements);

router.get("/announcement/:id", authMiddleware, detailAnnouncement);

router.post("/announcement/:id/publish", authMiddleware, publishAnnouncement);

router.get("/expense/create", authMiddleware, formExpense);

router.post("/expense/create", authMiddleware, uploadFile.single("proofFile"), createExpense);

router.get("/expense/my", authMiddleware, myExpenses);

router.get(
  "/expense/all",
  authMiddleware,
  roleMiddleware(["HR", "MANAGER", "PIMPINAN"]),
  allExpenses
);

router.get(
  "/expense/approval/manager",
  authMiddleware,
  roleMiddleware("MANAGER", "GENERAL MANAGER"),
  approvalManagerExpense
);

router.post(
  "/expense/:id/approve/manager",
  authMiddleware,
  roleMiddleware("MANAGER", "GENERAL MANAGER"),
  approveManagerExpense
);

router.get("/expense/finance", authMiddleware, roleMiddleware("KEUANGAN"), financeExpensePage);

router.post("/expense/:id/pay", authMiddleware, roleMiddleware("KEUANGAN"), payExpense);

export default router;
