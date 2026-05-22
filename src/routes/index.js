import express from "express";

import authRoutes from "./auth.routes.js";
import leaveRoutes from "./leave.routes.js";
import overtimeRoutes from "./overtime.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import kpiRoutes from "./kpi.routes.js";
import tripRoutes from "./trip.routes.js";
import salesRoutes from "./sales.routes.js";
import assignmentRoutes from "./assignment.routes.js";
import announcementRoutes from "./announcement.routes.js";
import expenseRoutes from "./expense.routes.js";
import dailylog from "./dailylog.route.js";
import finance from "./finance.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import approvalRoutes from "./approval.routes.js";
import Employee from "./employee.routes.js";
const router = express.Router();

router.use("/", authRoutes);
router.use("/", dashboardRoutes);
router.use("/", leaveRoutes);
router.use("/", overtimeRoutes);
router.use("/", attendanceRoutes);
router.use("/", Employee);

router.use("/", kpiRoutes);
router.use("/trip", tripRoutes);
router.use("/daily-log", dailylog);
router.use("/approvals", approvalRoutes);
router.use("/finance", finance);
router.use("/sales", salesRoutes);
router.use("/assignment", assignmentRoutes);
router.use("/announcement", announcementRoutes);
router.use("/", expenseRoutes);
router.get("/notifications", (req, res, next) => {
  try {
    // Pastikan user sudah login / ada session
    const user = req.session.user || { username: "M. Septiawan", role: "MANAGER" };

    // Data Dummy Notifikasi Sesuai Gambar UI
    const dummyNotifications = [
      {
        id: 1,
        type: "join",
        avatarText: "AS",
        isUnread: true,
        title: "Anna Srzand",
        text: "joined to 🔥 Final Presentation",
        time: "2h ago",
        category: "Social Media Plan",
      },
      {
        id: 2,
        type: "mention",
        avatarText: "JR",
        isUnread: true,
        title: "Jess Raddon",
        text: "mentioned you in 😍 Tennis List",
        time: "4h ago",
        category: "Hobby List",
      },
      {
        id: 3,
        type: "request",
        avatarText: "SM",
        isUnread: false,
        title: "Sandra Marx",
        text: "is requesting to upgrade Plan",
        time: "12h ago",
        category: "Hobby List",
        hasAction: true,
      },
      {
        id: 4,
        type: "upload",
        avatarText: "AS",
        isUnread: false,
        title: "Adam Smith",
        text: "upload a file",
        time: "1d ago",
        attachment: { name: "landing_page_ver2.fig", size: "2mb" },
      },
      {
        id: 5,
        type: "edit",
        avatarText: "RT",
        isUnread: false,
        title: "Ralpg Turner",
        text: "edited 🥂 Celebrate Info",
        time: "4h ago",
        category: "Hobby List",
        quote: "Let's add it to the main secret documentary",
      },
    ];

    // Hitung total yang belum dibaca
    const unreadCount = dummyNotifications.filter((n) => n.isUnread).length;

    return res.render("dashboard/notifications", {
      title: "Notifications - Zafa Tour",
      user,
      notifications: dummyNotifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
