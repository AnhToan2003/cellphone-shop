import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { apiClient } from "../../api/axios.js";
import { FALLBACK_PRODUCTS } from "../../data/fallbackProducts.js";

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

const getInitialCachedProducts = () => {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("nts_cached_products_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.items) && parsed.items.length > 0) {
          return {
            items: parsed.items,
            pagination: parsed.pagination || {
              page: 1,
              totalPages: 1,
              totalItems: parsed.items.length,
              limit: 12,
            },
          };
        }
      }
    } catch {
      // ignore
    }
  }
  return {
    items: FALLBACK_PRODUCTS,
    pagination: {
      page: 1,
      totalPages: 1,
      totalItems: FALLBACK_PRODUCTS.length,
      limit: 12,
    },
  };
};

const cachedInitial = getInitialCachedProducts();

const initialState = {
  items: cachedInitial.items,
  status: "idle",
  error: null,
  pagination: cachedInitial.pagination,
  selected: null,
  selectedStatus: "idle",
  filters: {
    search: "",
    brand: "",
    category: "",
    page: 1,
  },
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setFilters(state, action) {
      const previousFilters = state.filters;
      const keys = Object.keys(action.payload || {});
      const hasChange = keys.some((k) => action.payload[k] !== previousFilters[k]);
      if (!hasChange) return;

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

        // Cache default page 1 for instant 0ms subsequent renders
        if (
          state.filters.page === 1 &&
          !state.filters.search &&
          !state.filters.category &&
          !state.filters.brand &&
          Array.isArray(action.payload.data) &&
          action.payload.data.length > 0 &&
          typeof window !== "undefined"
        ) {
          try {
            localStorage.setItem(
              "nts_cached_products_v1",
              JSON.stringify({
                items: action.payload.data,
                pagination: action.payload.pagination,
              })
            );
          } catch {
            // ignore localStorage quota errors
          }
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
