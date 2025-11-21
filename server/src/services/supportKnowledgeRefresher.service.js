import SupportKnowledgeSnapshot from "../models/SupportKnowledgeSnapshot.js";
import { buildSupportKnowledge } from "./supportKnowledge.service.js";

const REFRESH_INTERVAL_MS = Number(
  process.env.SUPPORT_KB_REFRESH_INTERVAL_MS || 5 * 60 * 1000
);
const SNAPSHOT_TTL_MS = Number(process.env.KB_CACHE_TTL_MS || 60_000);

let refreshTimer = null;
let inFlight = false;
let lastRunAt = null;
let lastError = null;

const computeExpiresAt = () =>
  new Date(Date.now() + Math.max(SNAPSHOT_TTL_MS, REFRESH_INTERVAL_MS));

export const refreshSupportKnowledgeSnapshot = async ({
  force = true,
} = {}) => {
  if (inFlight) {
    return null;
  }

  inFlight = true;
  try {
    const content = await buildSupportKnowledge({ force });
    if (!content) {
      lastError = new Error("Support knowledge builder returned empty content");
      return null;
    }

    const now = new Date();
    const payload = {
      content,
      refreshedAt: now,
      expiresAt: computeExpiresAt(),
      metadata: {
        length: content.length,
      },
    };

    const snapshot = await SupportKnowledgeSnapshot.findOneAndUpdate(
      {},
      payload,
      {
        new: true,
        upsert: true,
        sort: { refreshedAt: -1 },
        setDefaultsOnInsert: true,
      }
    );

    lastRunAt = now;
    lastError = null;
    return snapshot;
  } catch (error) {
    lastError = error;
    console.error("[support] Failed to refresh knowledge snapshot:", error);
    return null;
  } finally {
    inFlight = false;
  }
};

const shouldSkipRefresher = () =>
  process.env.DISABLE_SUPPORT_KB_REFRESH === "1" ||
  process.env.NODE_ENV === "test";

export const startSupportKnowledgeRefresher = () => {
  if (refreshTimer || shouldSkipRefresher()) {
    return;
  }

  refreshSupportKnowledgeSnapshot({ force: true }).catch(() => {});

  refreshTimer = setInterval(() => {
    refreshSupportKnowledgeSnapshot({ force: true }).catch(() => {});
  }, REFRESH_INTERVAL_MS);

  if (typeof refreshTimer.unref === "function") {
    refreshTimer.unref();
  }
};

export const stopSupportKnowledgeRefresher = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

export const getSupportKnowledgeRefreshStatus = () => ({
  running: Boolean(refreshTimer),
  lastRunAt,
  lastError: lastError ? lastError.message : null,
});

export default {
  startSupportKnowledgeRefresher,
  stopSupportKnowledgeRefresher,
  refreshSupportKnowledgeSnapshot,
  getSupportKnowledgeRefreshStatus,
};
