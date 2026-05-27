import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { validate } from "../middlewares/validate.js";
import { createAnnouncementSchema } from "../validations/announcement.schema..js";
import { newForm, create, index, show, publish } from "../controllers/announcement.controller.js";

const router = express.Router();

// Semua route announcement butuh login
router.use(authMiddleware);

router.get("/", index);
router.get("/new", newForm);

router.post(
  "/",
  uploadFile.single("attachment"),

  (req, res, next) => {
    validate(createAnnouncementSchema)(req, res, (err) => {
      if (err) {
        return res.status(400).render("announcement/create", {
          title: "Buat Pengumuman",
          user: req.session.user,
          errors:
            err.details?.reduce((acc, e) => {
              acc[e.path[0]] = e.message;
              return acc;
            }, {}) || {},
          old: req.body,
        });
      }
      next();
    });
  },

  create
);

router.get("/:id", show);
router.post("/:id/publish", publish);

export default router;
