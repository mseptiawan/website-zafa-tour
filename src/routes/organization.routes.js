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

const router = express.Router();

router.get("/organization-structure", getWorkspace);

router.post("/api/bidang", createBidang);
router.put("/api/bidang/:id", updateBidang);
router.delete("/api/bidang/:id", deleteBidang);

router.post("/api/unit", createUnit);
router.put("/api/unit/:id", updateUnit);
router.delete("/api/unit/:id", deleteUnit);

router.post("/api/position", createPosition);
router.put("/api/position/:id", updatePosition);
router.delete("/api/position/:id", deletePosition);

export default router;
