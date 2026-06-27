import "dotenv/config";
import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import { connectRedis } from "./config/redis.js";
import connectDatabase from "./config/database.js";
import { initSocket } from "./utils/socket.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDatabase();
    await connectRedis();

    const server = http.createServer(app);

    initSocket(server);

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Database connection failed:", error);
  }
};

startServer();
