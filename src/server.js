// 1. IMPORT DOTENV CONFIG PALING ATAS
import "dotenv/config";

// 2. Sekarang baru import hal lain
import mongoose from "mongoose"; // opsional, cek apakah perlu
import app from "./app.js";
import { connectRedis } from "./config/redis.js";
import connectDatabase from "./config/database.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDatabase();
    await connectRedis();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Database connection failed:", error);
  }
};

startServer();
