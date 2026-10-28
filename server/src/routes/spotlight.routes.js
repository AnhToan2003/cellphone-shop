import { Router } from "express";
import { getSpotlight, updateSpotlight } from "../controllers/spotlight.controller.js";
import { authGuard, isAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getSpotlight);
router.put("/", authGuard, isAdmin, updateSpotlight);

export default router;
