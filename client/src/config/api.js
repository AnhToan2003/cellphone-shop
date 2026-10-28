const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const isLoopbackUrl = (value = "") => {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
  } catch {
    return false;
  }
};

// A local development URL must never leak into a production browser bundle.
export const API_BASE_URL =
  import.meta.env.PROD && isLoopbackUrl(configuredApiUrl)
    ? "/api"
    : configuredApiUrl ||
      (import.meta.env.PROD ? "/api" : "http://localhost:5000/api");

export const getApiUrl = (path = "") =>
  `${API_BASE_URL.replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;
