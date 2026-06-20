import dotenv from "dotenv";
dotenv.config();

import connectDatabase from "../../config/database.js";
import expenseSeeder from "./expense.seeder.js";

await connectDatabase();
await expenseSeeder();

process.exit();
