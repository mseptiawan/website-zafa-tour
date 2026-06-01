import { sessionMiddleware } from "./config/session.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { attachPermissions } from "./middlewares/permission.middleware.js";
import ejsMate from "ejs-mate";
import cookieParser from "cookie-parser";
import cors from "cors";
import flash from "connect-flash";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import methodOverride from "method-override";
import session from "express-session";
import MongoStore from "connect-mongo";
import injectUser from "./middlewares/injectUser.js";
import routes from "./routes/index.js";

// Import Models
import "./models/basic/Role.model.js";
import "./models/basic/User.model.js";
import "./models/leave/Leave.model.js";
import "./models/leave/LeaveApproval.model.js";
import "./models/leave/LeaveBalance.model.js";
import "./models/leave/LeaveType.model.js";
import "./models/leave/LeaveCancellation.model.js";
import "./models/basic/Bidang.model.js";
import "./models/basic/Unit.model.js";
import "./models/basic/Position.model.js";
import "./models/employee/Employee.model.js";
import "./models/kpi/KpiTemplate.model.js";
import "./models/kpi/KpiTemplateDetail.model.js";
import "./models/kpi/UnitKpiMapping.model.js";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 1. CONFIGURATION & CORE MIDDLEWARES
// ==========================================
app.use(cors());
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ==========================================
// 2. STATIC FILES
// ==========================================
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// View Engine Setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ==========================================
// 3. SESSION & FLASH AUTHENTICATION
// ==========================================
app.use(sessionMiddleware);
app.use(flash());

// Custom Middlewares Pemohon Data
app.use(injectUser);
app.use(attachPermissions);

// ==========================================
// 4. GLOBAL LOCALS (HARUS SEBELUM ROUTES)
// ==========================================
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.user = req.session.user || null;
  next();
});

// AWS S3 / R2 Setup
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ==========================================
// 5. ROUTES
// ==========================================
app.use("/", routes);

// ==========================================
// 6. ERROR HANDLERS (Selalu paling bawah)
// ==========================================
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  const error = new Error("Halaman yang Anda cari tidak ditemukan (404)");
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  console.error("Error Handler Catch:", err);

  const status = err.status || 500;

  if (err.details) {
    return res.status(status).json({
      success: false,
      message: err.message || err.details[0].message,
      errors: err.details,
    });
  }

  // Jika error terjadi di view/halaman biasa, tampilkan flash/redirect bukan JSON

  return res.status(status).json({
    success: false,
    message: err.message || "Terjadi kesalahan internal pada server.",
  });
});

export default app;
