import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import { newForm, create, index, show, publish } from "../controllers/announcement.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", index);
router.get("/new", newForm);
router.post("/", uploadFile.single("attachment"), create);

router.get("/:id", show);
router.post("/:id/publish", publish);

export default router;
