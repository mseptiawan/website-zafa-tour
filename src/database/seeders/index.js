import dotenv from "dotenv";
import mongoose from "mongoose";

import roleSeeder from "./roleSeeder.js";
import bidangSeeder from "./bidangSeeder.js";
import unitSeeder from "./unitSeeder.js";
import userSeeder from "./userSeeder.js";

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

try {
  console.log("Seeder started...");

  await roleSeeder();
  await bidangSeeder();
  await unitSeeder();
  await userSeeder();

  console.log("All seeders success");

  process.exit();
} catch (error) {
  console.log(error);

  process.exit(1);
}
