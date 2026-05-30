import { sessionMiddleware } from "./config/session.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { attachPermissions } from "./middlewares/permission.middleware.js";
import ejsMate from "ejs-mate";
import cookieParser from "cookie-parser";
import cors from "cors";
import flash from "connect-flash";
import methodOverride from "method-override";
import session from "express-session";
import MongoStore from "connect-mongo";
import injectUser from "./middlewares/injectUser.js";
import routes from "./routes/index.js";
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
app.use(cors());
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(sessionMiddleware);
app.use(injectUser);
app.use(attachPermissions);
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});
app.use("/", routes);

app.use((req, res, next) => {
  const error = new Error("Halaman yang Anda cari tidak ditemukan (404)");
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).render("error", {
    message: err.message || "Terjadi kesalahan internal pada server.",
    user: res.locals.user,
  });
});
export default app;
