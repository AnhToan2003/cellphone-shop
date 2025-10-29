import axios from "axios";
import { addActivity } from "../store/slices/apiActivitySlice.js";

let apiActivityDispatch = null;

export const setApiActivityDispatch = (dispatch) => {
  apiActivityDispatch = dispatch;
};

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const AUTH_STORAGE_KEY = "cellphones_auth";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  // tag start time for duration calc
  config.metadata = { start: Date.now() };
  try {
    const stored = window.sessionStorage?.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    }
  } catch (error) {
    window.sessionStorage?.removeItem(AUTH_STORAGE_KEY);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    try {
      const { config, status, data } = response;
      const durationMs = Date.now() - (config.metadata?.start || Date.now());
      if (apiActivityDispatch) {
        apiActivityDispatch(
          addActivity({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            time: new Date().toISOString(),
            method: config.method?.toUpperCase() || "GET",
            url: config.baseURL
              ? new URL(config.url || "", config.baseURL).toString()
              : config.url,
            status,
            durationMs,
            requestBody: safeSerialize(config.data),
            responseBody: safeSerialize(data),
            error: null,
          })
        );
      }
    } catch {}
    return response;
  },
  (error) => {
    try {
      const config = error.config || {};
      const status = error.response?.status ?? null;
      const data = error.response?.data;
      const durationMs = Date.now() - (config.metadata?.start || Date.now());
      if (apiActivityDispatch) {
        apiActivityDispatch(
          addActivity({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            time: new Date().toISOString(),
            method: config.method?.toUpperCase() || "GET",
            url: config.baseURL
              ? new URL(config.url || "", config.baseURL).toString()
              : config.url,
            status,
            durationMs,
            requestBody: safeSerialize(config.data),
            responseBody: safeSerialize(data),
            error: safeSerialize(error?.message || error?.toString?.()),
          })
        );
      }
    } catch {}
    return Promise.reject(error);
  }
);

function safeSerialize(val) {
  try {
    if (typeof val === "string") return val;
    return JSON.stringify(val);
  } catch {
    return "[không thể tuần tự hóa]";
  }
}
