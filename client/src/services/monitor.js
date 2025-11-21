const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const MONITOR_ENDPOINT = `${API_BASE_URL}/monitor/activity`;
const ACTIVITY_HEADER = "x-activity-ingest";

const sendJson = async (method, body) => {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      [ACTIVITY_HEADER]: "1",
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return fetch(MONITOR_ENDPOINT, options);
};

export const reportActivity = (payload) => {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(MONITOR_ENDPOINT, blob);
    } else {
      sendJson("POST", payload);
    }
  } catch (error) {
    // silent fail
  }
};

export const fetchMonitorActivity = async () => {
  const response = await fetch(MONITOR_ENDPOINT, {
    method: "GET",
    headers: {
      Accept: "application/json",
      [ACTIVITY_HEADER]: "1",
    },
  });
  if (!response.ok) {
    throw new Error("Unable to load activity log");
  }
  const payload = await response.json();
  return payload?.data ?? [];
};

export const clearMonitorActivity = async () => {
  await sendJson("DELETE");
};
