import session from "express-session";
import { RedisStore } from "connect-redis";
import { redisClient } from "./redis.js";

export const sessionMiddleware = session({
  store: new RedisStore({
    client: redisClient,
    prefix: "hris:",
  }),

  secret: process.env.SESSION_SECRET || "rahasia",
  resave: false,
  saveUninitialized: false,
  rolling: true,

  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 3 * 24 * 60 * 60 * 1000,
    path: "/",
    domain: "localhost",
  },
});
