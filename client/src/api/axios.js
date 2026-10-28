import axios from "axios";
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "/api" : "http://localhost:5000/api");
const AUTH_STORAGE_KEY = "cellphones_auth";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
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
