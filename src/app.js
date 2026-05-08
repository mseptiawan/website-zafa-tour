import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import ejsMate from "ejs-mate";
import cookieParser from "cookie-parser";
import cors from "cors";
import methodOverride from "method-override";

import session from "express-session";
import MongoStore from "connect-mongo";

// REGISTER MODEL
import "./models/Role.js";
import "./models/User.js";
import "./models/Leave.js";
import "./models/Bidang.js";
import "./models/Unit.js";

// ROUTES
import webRoutes from "./routes/web.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

/*
|--------------------------------------------------------------------------
| BODY PARSER
|--------------------------------------------------------------------------
*/
app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(express.json());

/*
|--------------------------------------------------------------------------
| SECURITY & UTILITY
|--------------------------------------------------------------------------
*/
app.use(cookieParser());

app.use(cors());

app.use(methodOverride("_method"));

/*
|--------------------------------------------------------------------------
| SESSION
|--------------------------------------------------------------------------
*/
app.use(
  session({
    secret: process.env.SESSION_SECRET || "hris_secret_session",

    resave: false,

    saveUninitialized: false,

    rolling: true,

    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),

    cookie: {
      httpOnly: true,

      secure: false,

      sameSite: "lax",

      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

/*
|--------------------------------------------------------------------------
| STATIC FILES
|--------------------------------------------------------------------------
*/
app.use(express.static(path.join(__dirname, "public")));

/*
|--------------------------------------------------------------------------
| VIEW ENGINE
|--------------------------------------------------------------------------
*/
app.engine("ejs", ejsMate);

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

/*
|--------------------------------------------------------------------------
| GLOBAL USER EJS
|--------------------------------------------------------------------------
*/
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;

  next();
});

/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
*/
app.use("/", webRoutes);

export default app;
