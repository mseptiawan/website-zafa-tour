import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.v2.js"; // Jaga-jaga jika ada schema validation
// import { createCategorySchema } from "../validations/expenseCategory.schema.js";

import { index, store, update, toggleStatus } from "../controllers/expenseCategory.controller.js";

const router = express.Router();

// Semua route di bawah ini wajib login
router.use(authMiddleware);

// Penamaan route & method mengikuti standard RESTful/Best Practice Anda
router.get("/", index);
router.post("/", store);
router.put("/:id", update);
router.patch("/toggle-status/:id", toggleStatus);

export default router;
