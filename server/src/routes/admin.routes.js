import { Router } from "express";

import {
  deleteUser,
  getOverviewStats,
  listUsers,
  listUserRankings,
  updateUserRanking,
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
import {
  adminCreateHomeCategory,
  adminDeleteHomeCategory,
  adminListHomeCategories,
  adminUpdateHomeCategory,
} from "../controllers/homeCategory.controller.js";
import {
  adminCreateBrand,
  adminDeleteBrand,
  adminListBrands,
  adminUpdateBrand,
} from "../controllers/brand.controller.js";
import { authGuard, isAdmin } from "../middleware/auth.js";
import { productUpload } from "../middleware/upload.js";

const router = Router();

router.use(authGuard, isAdmin);

router.get("/overview", getOverviewStats);
router.get("/users/rankings", listUserRankings);
router.get("/users", listUsers);
router.patch("/users/:id", updateUserRole);
router.patch("/users/:id/ranking", updateUserRanking);
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
router.get("/home-categories", adminListHomeCategories);
router.post("/home-categories", adminCreateHomeCategory);
router.patch("/home-categories/:id", adminUpdateHomeCategory);
router.delete("/home-categories/:id", adminDeleteHomeCategory);
router.get("/brands", adminListBrands);
router.post("/brands", adminCreateBrand);
router.patch("/brands/:id", adminUpdateBrand);
router.delete("/brands/:id", adminDeleteBrand);

export default router;
