import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { apiClient } from "../../api/axios.js";

export const fetchProducts = createAsyncThunk(
  "products/list",
  async (params = {}, thunkAPI) => {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, value);
        }
      });
      const { data } = await apiClient.get(
        `/products${query.toString() ? `?${query.toString()}` : ""}`
      );
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Không thể tải danh sách sản phẩm"
      );
    }
  }
);

export const fetchProductBySlug = createAsyncThunk(
  "products/detail",
  async (slug, thunkAPI) => {
    try {
      const { data } = await apiClient.get(`/products/${slug}`);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Không tìm thấy sản phẩm"
      );
    }
  }
);

const initialState = {
  items: [],
  status: "idle",
  error: null,
  pagination: {
    page: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 12,
  },
  selected: null,
  selectedStatus: "idle",
  filters: {
    search: "",
    brand: "",
    page: 1,
  },
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setFilters(state, action) {
      const previousFilters = state.filters;
      const nextFilters = { ...previousFilters, ...action.payload };
      const searchChanged =
        action.payload.search !== undefined &&
        action.payload.search !== previousFilters.search;
      const brandChanged =
        action.payload.brand !== undefined &&
        action.payload.brand !== previousFilters.brand;

      if (action.payload.page !== undefined) {
        const parsedPage = Number(action.payload.page);
        nextFilters.page =
          Number.isFinite(parsedPage) && parsedPage > 0
            ? Math.floor(parsedPage)
            : 1;
      }

      if (
        action.payload.page === undefined &&
        (searchChanged || brandChanged)
      ) {
        nextFilters.page = 1;
      }

      state.filters = nextFilters;
    },
    clearSelected(state) {
      state.selected = null;
      state.selectedStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.data;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Không thể tải danh sách sản phẩm";
      })
      .addCase(fetchProductBySlug.pending, (state) => {
        state.selectedStatus = "loading";
        state.selected = null;
      })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.selectedStatus = "succeeded";
        state.selected = action.payload.data;
      })
      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.selectedStatus = "failed";
        state.error = action.payload || "Không tìm thấy sản phẩm";
        state.selected = null;
      });
  },
});

export const { setFilters, clearSelected } = productSlice.actions;

export default productSlice.reducer;
