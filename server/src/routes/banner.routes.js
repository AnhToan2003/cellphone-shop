import { Router } from "express";

import {
  createBanner,
  deleteBanner,
  getBanners,
  updateBanner,
} from "../controllers/banner.controller.js";
import { authGuard, isAdmin } from "../middleware/auth.js";
import { bannerUpload } from "../middleware/upload.js";

const router = Router();

router.get("/", getBanners);
router.post(
  "/upload",
  authGuard,
  isAdmin,
  bannerUpload.single("image"),
  createBanner
);
router.put(
  "/:id",
  authGuard,
  isAdmin,
  bannerUpload.single("image"),
  updateBanner
);
router.delete("/:id", authGuard, isAdmin, deleteBanner);

export default router;
