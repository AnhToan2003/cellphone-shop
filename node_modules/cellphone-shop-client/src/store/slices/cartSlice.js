import { createSlice } from "@reduxjs/toolkit";

const CART_KEY = "cellphones_cart";

const loadItems = () => {
  try {
    const stored = localStorage.getItem(CART_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (Array.isArray(parsed.items)) {
      return parsed.items;
    }
    return [];
  } catch (error) {
    console.warn("Không thể đọc dữ liệu giỏ hàng đã lưu", error);
    return [];
  }
};

const persistItems = (items) => {
  localStorage.setItem(CART_KEY, JSON.stringify({ items }));
};

const calculateTotals = (items) =>
  items.reduce(
    (acc, item) => ({
      totalQuantity: acc.totalQuantity + item.quantity,
      totalAmount: acc.totalAmount + item.price * item.quantity,
    }),
    { totalQuantity: 0, totalAmount: 0 }
  );

const initialItems = loadItems();
const { totalQuantity, totalAmount } = calculateTotals(initialItems);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: initialItems,
    totalQuantity,
    totalAmount,
  },
  reducers: {
    addItem(state, action) {
      const payload = action.payload;
      const qty = payload.quantity || 1;
      const variantKeyParts = [
        payload.id,
        payload.selectedColor || "",
        payload.selectedCapacity || "",
      ];
      const cartId = variantKeyParts.filter(Boolean).join("|") || payload.id;

      const existing = state.items.find((item) => item.id === cartId);

      if (existing) {
        existing.quantity = Math.min(existing.quantity + qty, 99);
      } else {
        state.items.push({
          id: cartId,
          productId: payload.id,
          name: payload.name,
          slug: payload.slug,
          price: payload.price,
          image: payload.image || "",
          quantity: Math.min(qty, 99),
          color: payload.selectedColor || null,
          capacity: payload.selectedCapacity || null,
        });
      }

      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      persistItems(state.items);
    },
    increaseQuantity(state, action) {
      const item = state.items.find((cartItem) => cartItem.id === action.payload);
      if (!item) {
        return;
      }
      item.quantity = Math.min(item.quantity + 1, 99);

      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      persistItems(state.items);
    },
    decreaseQuantity(state, action) {
      const item = state.items.find((cartItem) => cartItem.id === action.payload);
      if (!item) {
        return;
      }
      item.quantity = Math.max(1, item.quantity - 1);

      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      persistItems(state.items);
    },
    removeItem(state, action) {
      state.items = state.items.filter((item) => item.id !== action.payload);

      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      persistItems(state.items);
    },
    clearCart(state) {
      state.items = [];
      state.totalAmount = 0;
      state.totalQuantity = 0;
      localStorage.removeItem(CART_KEY);
    },
  },
});

export const {
  addItem,
  increaseQuantity,
  decreaseQuantity,
  removeItem,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
