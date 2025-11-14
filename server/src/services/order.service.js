import { Product } from "../models/Product.js";
import { User } from "../models/User.js";

export const restockOrderInventory = async (order) => {
  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    return;
  }

  await Promise.all(
    order.items.map(async (item) => {
      const productRef = item?.product;
      const productId =
        typeof productRef === "object" && productRef?._id
          ? productRef._id
          : productRef;

      if (!productId) return;

      await Product.findByIdAndUpdate(
        productId,
        { $inc: { stock: item.quantity } },
        { new: false }
      );
    })
  );
};

export const adjustUserLifetimeSpend = async (userId, amount) => {
  const delta = Number(amount);
  if (!userId || !Number.isFinite(delta) || delta === 0) {
    return;
  }

  const userDoc = await User.findById(userId);
  if (!userDoc) return;

  const currentValue = Number(userDoc.lifetimeSpend || 0);
  const nextValue = Math.max(0, currentValue + delta);

  userDoc.lifetimeSpend = nextValue;
  if (typeof userDoc.recalculateTier === "function") {
    userDoc.recalculateTier();
  }

  await userDoc.save();
};

export default {
  restockOrderInventory,
  adjustUserLifetimeSpend,
};
