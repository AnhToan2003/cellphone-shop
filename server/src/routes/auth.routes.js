import { Router } from "express";

import {
  currentUser,
  login,
  register,
  updateProfile,
} from "../controllers/auth.controller.js";
import { authGuard } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authGuard, currentUser);
router.patch("/me", authGuard, updateProfile);

export default router;
