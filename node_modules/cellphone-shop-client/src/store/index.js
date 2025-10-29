import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice.js";
import cartReducer from "./slices/cartSlice.js";
import orderReducer from "./slices/orderSlice.js";
import productReducer from "./slices/productSlice.js";
import apiActivityReducer, {
  API_ACTIVITY_STORAGE_KEY,
} from "./slices/apiActivitySlice.js";
import favoritesReducer, {
  FAVORITES_STORAGE_KEY,
} from "./slices/favoritesSlice.js";
import { setApiActivityDispatch } from "../api/axios.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    orders: orderReducer,
    products: productReducer,
    apiActivity: apiActivityReducer,
    favorites: favoritesReducer,
  },
});

setApiActivityDispatch(store.dispatch);

if (typeof window !== "undefined") {
  let previousActivity = store.getState().apiActivity.items;
  let previousFavorites = store.getState().favorites.items;
  store.subscribe(() => {
    const state = store.getState();
    const currentActivity = state.apiActivity.items;
    const currentFavorites = state.favorites.items;

    if (previousActivity !== currentActivity) {
      previousActivity = currentActivity;
      try {
        window.localStorage.setItem(
          API_ACTIVITY_STORAGE_KEY,
          JSON.stringify(currentActivity)
        );
      } catch (error) {
        // ignore persistence errors (e.g. storage disabled)
      }
    }

    if (previousFavorites !== currentFavorites) {
      previousFavorites = currentFavorites;
      try {
        window.localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(currentFavorites)
        );
      } catch (error) {
        // ignore persistence errors (e.g. storage disabled)
      }
    }
  });
}

