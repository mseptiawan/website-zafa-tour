import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import { newForm, create, myLoans, edit, update } from "../controllers/loan.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/new", newForm);
router.post("/", uploadFile.single("attachments"), create);

router.get("/my", myLoans);

router.get("/:id/edit", edit);
router.post("/:id/edit", uploadFile.single("attachments"), update);

export default router;
