import { Router } from "express";

import {
  createProduct,
  createProductReview,
  deleteProduct,
  getProductBySlug,
  getProductReviews,
  listProducts,
  updateProduct,
  uploadProduct,
} from "../controllers/product.controller.js";
import { authGuard, isAdmin, optionalAuth } from "../middleware/auth.js";
import { productUpload } from "../middleware/upload.js";

const router = Router();

router.get("/", optionalAuth, listProducts);
router.get("/:slug/reviews", optionalAuth, getProductReviews);
router.post("/:slug/reviews", authGuard, createProductReview);
router.get("/:slug", optionalAuth, getProductBySlug);
router.post(
  "/upload",
  authGuard,
  isAdmin,
  productUpload.single("image"),
  uploadProduct
);
router.post("/", authGuard, isAdmin, createProduct);
router.put("/:id", authGuard, isAdmin, updateProduct);
router.delete("/:id", authGuard, isAdmin, deleteProduct);

export default router;
