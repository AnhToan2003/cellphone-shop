import { Router } from "express";

import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getMyWarrantyItems,
  confirmMyVietqrPayment,
  cancelMyOrder,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { adminGuard, authGuard } from "../middleware/auth.js";

const router = Router();

router.post("/", authGuard, createOrder);
router.get("/me", authGuard, getMyOrders);
router.get("/me/warranty", authGuard, getMyWarrantyItems);
router.patch(
  "/:id/payment/confirm",
  authGuard,
  confirmMyVietqrPayment
);
router.get("/", authGuard, adminGuard, getAllOrders);
router.patch("/:id/status", authGuard, adminGuard, updateOrderStatus);
router.patch("/:id/cancel", authGuard, cancelMyOrder);

export default router;
