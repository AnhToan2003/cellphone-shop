import axios from "axios";
import { addActivity } from "../store/slices/apiActivitySlice.js";
import { reportActivity } from "../services/monitor.js";

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
      const payload = buildActivityPayload(response);
      publishActivity(payload);
    } catch {}
    return response;
  },
  (error) => {
    try {
      const payload = buildActivityPayload(null, error);
      publishActivity(payload);
    } catch {}
    return Promise.reject(error);
  }
);

const publishActivity = (activity) => {
  if (!activity) return;
  if (apiActivityDispatch) {
    apiActivityDispatch(addActivity(activity));
  }
  reportActivity(activity);
};

const buildActivityPayload = (response, error) => {
  const source = response || error?.response;
  const config = source?.config || error?.config || response?.config || {};
  const status = response?.status ?? error?.response?.status ?? null;
  const data = response?.data ?? error?.response?.data;
  const durationMs = Date.now() - (config.metadata?.start || Date.now());

  return {
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
    error: error
      ? safeSerialize(error?.message || error?.toString?.())
      : null,
  };
};

function safeSerialize(val) {
  try {
    if (typeof val === "string") return val;
    return JSON.stringify(val);
  } catch {
    return "[không thể tuần tự hóa]";
  }
}
