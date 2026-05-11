import { sessionMiddleware } from "./config/session.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import employeeRoute from "./routes/employeeRoute.js";
import { attachPermissions } from "./middlewares/permission.middleware.js";
import ejsMate from "ejs-mate";
import cookieParser from "cookie-parser";
import cors from "cors";
import methodOverride from "method-override";

import session from "express-session";
import MongoStore from "connect-mongo";

import injectUser from "./middlewares/injectUser.js";
import webRoutes from "./routes/web.js";

/* =========================
   MODELS AUTO REGISTER
========================= */
import "./models/Role.js";
import "./models/User.js";
import "./models/Leave.js";
import "./models/Bidang.js";
import "./models/Unit.js";
import "./models/Position.js";
import "./models/Employee.js";
import "./models/KpiTemplate.js";
import "./models/KpiTemplateDetail.js";
import "./models/UnitKpiMapping.js";

/* =========================
   INIT APP
========================= */
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   SECURITY & UTILITY
========================= */
app.use(cors());
app.use(cookieParser());
app.use(methodOverride("_method"));

/* =========================
   BODY PARSER (FIXED)
   - cukup 1x saja
   - aman untuk file + JSON
========================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =========================
   SESSION (FIXED CLEAN)
========================= */
app.use(sessionMiddleware);
/* =========================
   INJECT USER (WAJIB SETELAH SESSION)
========================= */
app.use(injectUser);
app.use(attachPermissions);

/* =========================
   STATIC FILES (FIXED)
========================= */
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

/* =========================
   VIEW ENGINE
========================= */
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* =========================
   GLOBAL USER EJS
========================= */
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

/* =========================
   ROUTES
========================= */
app.use("/", webRoutes);
app.use("/employee", employeeRoute);

export default app;
