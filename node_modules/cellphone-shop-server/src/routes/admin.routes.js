import { Router } from "express";

import {
  deleteUser,
  getOverviewStats,
  listUsers,
  updateUserRole,
} from "../controllers/admin.controller.js";
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminListProducts,
  adminUpdateProduct,
  adminUploadProductImage,
} from "../controllers/admin.product.controller.js";
import {
  createPromotion,
  deletePromotion,
  listPromotions,
  updatePromotion,
} from "../controllers/promotion.controller.js";
import { authGuard, isAdmin } from "../middleware/auth.js";
import { productUpload } from "../middleware/upload.js";

const router = Router();

router.use(authGuard, isAdmin);

router.get("/overview", getOverviewStats);
router.get("/users", listUsers);
router.patch("/users/:id", updateUserRole);
router.delete("/users/:id", deleteUser);
router.get("/products", adminListProducts);
router.post("/products", adminCreateProduct);
router.put("/products/:id", adminUpdateProduct);
router.delete("/products/:id", adminDeleteProduct);
router.get("/promotions", listPromotions);
router.post("/promotions", createPromotion);
router.patch("/promotions/:id", updatePromotion);
router.delete("/promotions/:id", deletePromotion);
router.post(
  "/products/upload",
  productUpload.single("image"),
  adminUploadProductImage
);

export default router;
