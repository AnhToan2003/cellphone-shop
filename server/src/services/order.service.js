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

      const color = item.color || "";
      const capacity = item.capacity || "";
      const variantId = item.variantId || null;
      if (variantId || color || capacity) {
        const variantRestock = await Product.updateOne(
          {
            _id: productId,
            variants: {
              $elemMatch: {
                ...(variantId
                  ? { _id: variantId }
                  : { color, capacity }),
                stock: { $ne: null },
              },
            },
          },
          {
            $inc: {
              stock: item.quantity,
              "variants.$[variant].stock": item.quantity,
            },
          },
          {
            arrayFilters: [
              {
                ...(variantId
                  ? { "variant._id": variantId }
                  : {
                      "variant.color": color,
                      "variant.capacity": capacity,
                    }),
                "variant.stock": { $ne: null },
              },
            ],
          }
        );

        if (variantRestock.matchedCount > 0) return;
      }

      await Product.updateOne(
        { _id: productId },
        { $inc: { stock: item.quantity } }
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
