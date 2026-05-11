import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectRedis } from "./config/redis.js";

import connectDatabase from "./config/database.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDatabase();
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Database connection failed:", error);
  }
};

startServer();
