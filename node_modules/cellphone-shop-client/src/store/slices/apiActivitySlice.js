import { createSlice } from "@reduxjs/toolkit";

// Keep a rolling list of recent API activities
// Each item: { id, time, method, url, status, durationMs, requestBody, responseBody, error }

export const API_ACTIVITY_STORAGE_KEY = "cellphones_api_activity";
const MAX_ITEMS = 200;

const loadPersistedItems = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(API_ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
  } catch (error) {
    return [];
  }
};

const initialState = {
  items: loadPersistedItems(),
  maxItems: MAX_ITEMS,
};

const apiActivitySlice = createSlice({
  name: "apiActivity",
  initialState,
  reducers: {
    addActivity(state, { payload }) {
      state.items.unshift(payload);
      if (state.items.length > state.maxItems) {
        state.items.pop();
      }
    },
    clearActivities(state) {
      state.items = [];
    },
  },
});

export const { addActivity, clearActivities } = apiActivitySlice.actions;
export default apiActivitySlice.reducer;
