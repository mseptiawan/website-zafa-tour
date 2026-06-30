import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";

import { index, store, update, toggleStatus } from "../controllers/expenseCategory.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", index);
router.post("/", store);
router.put("/:id", update);
router.patch("/toggle-status/:id", toggleStatus);

export default router;
