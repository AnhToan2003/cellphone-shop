import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { apiClient } from "../../api/axios.js";

const AUTH_KEY = "cellphones_auth";

const loadAuth = () => {
  if (typeof window === "undefined") {
    return { user: null, token: null };
  }
  try {
    const stored = window.sessionStorage?.getItem(AUTH_KEY);
    if (!stored) {
      return { user: null, token: null };
    }
    const parsed = JSON.parse(stored);
    return {
      user: parsed.user || null,
      token: parsed.token || null,
    };
  } catch (error) {
    console.warn("Không thể đọc dữ liệu đăng nhập đã lưu", error);
    return { user: null, token: null };
  }
};

const persistAuth = (user, token) => {
  if (typeof window === "undefined") {
    return;
  }
  if (!token) {
    window.sessionStorage?.removeItem(AUTH_KEY);
    return;
  }

  window.sessionStorage?.setItem(
    AUTH_KEY,
    JSON.stringify({
      user,
      token,
    })
  );
};

export const registerUser = createAsyncThunk(
  "auth/register",
  async (payload, thunkAPI) => {
    try {
      const username =
        payload.username ||
        payload?.email?.split?.("@")?.[0]?.replace(/[^a-zA-Z0-9._-]/g, "") ||
        "";

      const preparedPayload = {
        ...payload,
        username,
      };

      const { data } = await apiClient.post("/auth/register", preparedPayload);
      return data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Không thể đăng ký"
      );
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload, thunkAPI) => {
    try {
      const body = {
        identifier: payload.identifier || payload.email || payload.username,
        password: payload.password,
      };

      const { data } = await apiClient.post("/auth/login", body);
      return data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Email hoặc mật khẩu không hợp lệ"
      );
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/me",
  async (_, thunkAPI) => {
    try {
      const { data } = await apiClient.get("/auth/me");
      return data.data.user;
    } catch (error) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message || "Không thể tải thông tin tài khoản";
      return thunkAPI.rejectWithValue({ status, message });
    }
  }
);

const { user, token } = loadAuth();

const initialState = {
  user,
  token,
  status: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
      persistAuth(null, null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        persistAuth(state.user, state.token);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Không thể đăng ký";
      })
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        persistAuth(state.user, state.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Email hoặc mật khẩu không hợp lệ";
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        persistAuth(state.user, state.token);
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = "idle";
        if (action.payload?.status === 401) {
          state.user = null;
          state.token = null;
          persistAuth(null, null);
        } else {
          state.error =
            action.payload?.message || "Không thể tải thông tin tài khoản";
        }
      });
  },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;
