const MAX_ENTRIES = 500;
const activityBuffer = [];

export const addActivityLog = (entry) => {
  if (!entry || typeof entry !== "object") return;
  activityBuffer.unshift({
    ...entry,
    ingestedAt: new Date().toISOString(),
  });
  if (activityBuffer.length > MAX_ENTRIES) {
    activityBuffer.length = MAX_ENTRIES;
  }
};

export const getActivityLogs = () => activityBuffer;

export const clearActivityLogs = () => {
  activityBuffer.length = 0;
};

export const getActivityStats = () => ({
  total: activityBuffer.length,
  lastActivity: activityBuffer[0]?.time ?? null,
});

export default {
  addActivityLog,
  getActivityLogs,
  clearActivityLogs,
  getActivityStats,
};
