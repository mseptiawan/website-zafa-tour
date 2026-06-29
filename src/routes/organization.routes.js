import express from "express";
import {
  getWorkspace,
  createBidang,
  updateBidang,
  deleteBidang,
  createUnit,
  updateUnit,
  deleteUnit,
  createPosition,
  updatePosition,
  deletePosition,
} from "../controllers/organization.controller.js";
import { validate } from "../middlewares/validate.js";
import { bidangSchema, unitSchema, positionSchema } from "../validations/organization.schema.js";

const router = express.Router();

router.get("/", getWorkspace);

router.post("/bidang", validate(bidangSchema), createBidang);
router.put("/bidang/:id", validate(bidangSchema), updateBidang);
router.delete("/bidang/:id", deleteBidang);

router.post("/unit", validate(unitSchema), createUnit);
router.put("/unit/:id", validate(unitSchema), updateUnit);
router.delete("/unit/:id", deleteUnit);

router.post("/position", validate(positionSchema), createPosition);
router.put("/position/:id", validate(positionSchema), updatePosition);
router.delete("/position/:id", deletePosition);
export default router;
