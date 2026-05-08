import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import ejsMate from "ejs-mate";
import cookieParser from "cookie-parser";
import cors from "cors";
import methodOverride from "method-override";
import session from "express-session";
import "./models/Role.js";
import "./models/User.js";
import "./models/Leave.js";
import "./models/Bidang.js";
import "./models/Unit.js";
import webRoutes from "./routes/web.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
|--------------------------------------------------------------------------
| Body Parser
|--------------------------------------------------------------------------
*/
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/*
|--------------------------------------------------------------------------
| Security & Utility
|--------------------------------------------------------------------------
*/
app.use(cookieParser());
app.use(cors());
app.use(methodOverride("_method"));

/*
|--------------------------------------------------------------------------
| Session (FIXED + lebih aman)
|--------------------------------------------------------------------------
*/
app.use(
  session({
    secret: process.env.SESSION_SECRET || "hris_secret_session",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: "lax", // 🔥 penting
    },
  }),
);

/*
|--------------------------------------------------------------------------
| Static Files
|--------------------------------------------------------------------------
*/
app.use(express.static(path.join(__dirname, "public")));

/*
|--------------------------------------------------------------------------
| View Engine
|--------------------------------------------------------------------------
*/
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/*
|--------------------------------------------------------------------------
| Global Variables (LOGIN USER GLOBAL DI EJS)
|--------------------------------------------------------------------------
*/
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/
app.use("/", webRoutes);

export default app;
