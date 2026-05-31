import express from "express";
const router = express.Router();

import {
  renderCategoryPage,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
} from "../controllers/expenseCategory.controller.js";

router.get("/", renderCategoryPage);

router.post("/", createCategory);
router.put("/:id", updateCategory);
router.patch("/toggle-status/:id", toggleCategoryStatus);

export default router;
