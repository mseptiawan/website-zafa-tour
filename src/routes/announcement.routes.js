import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { validate } from "../middlewares/validate.v2.js";
import { createAnnouncementSchema } from "../validations/announcement.schema..js";
import { create, store, index, show } from "../controllers/announcement.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", index);
router.get("/new", create);
router.post("/", uploadFile.single("attachment"), validate(createAnnouncementSchema), store);
router.get("/:id", show);

export default router;
