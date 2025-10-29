import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { apiClient } from "../../api/axios.js";

export const createOrder = createAsyncThunk(
  "orders/create",
  async (payload, thunkAPI) => {
    try {
      const { data } = await apiClient.post("/orders", payload);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Không thể đặt hàng"
      );
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  "orders/me",
  async (_, thunkAPI) => {
    try {
      const { data } = await apiClient.get("/orders/me");
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Không thể tải danh sách đơn hàng"
      );
    }
  }
);

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    items: [],
    latestOrder: null,
    status: "idle",
    error: null,
  },
  reducers: {
    clearLatestOrder(state) {
      state.latestOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.latestOrder = action.payload.data;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Không thể đặt hàng";
      })
      .addCase(fetchMyOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.data;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Không thể tải danh sách đơn hàng";
      });
  },
});

export const { clearLatestOrder } = orderSlice.actions;

export default orderSlice.reducer;
