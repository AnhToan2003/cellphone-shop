import { Router } from "express";

import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getMyWarrantyItems,
  lookupWarrantyByPhone,
  cancelMyOrder,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { adminGuard, authGuard } from "../middleware/auth.js";

const router = Router();

// Public electronic warranty lookup by phone number
router.get("/warranty/lookup", lookupWarrantyByPhone);

router.post("/", authGuard, createOrder);
router.get("/me", authGuard, getMyOrders);
router.get("/me/warranty", authGuard, getMyWarrantyItems);
router.get("/", authGuard, adminGuard, getAllOrders);
router.patch("/:id/status", authGuard, adminGuard, updateOrderStatus);
router.patch("/:id/cancel", authGuard, cancelMyOrder);

export default router;
