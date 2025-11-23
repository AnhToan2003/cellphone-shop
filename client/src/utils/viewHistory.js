const HISTORY_KEY = "cellphones_view_history";
const MAX_ITEMS = 30;

const safeParse = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const loadViewHistory = () => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(HISTORY_KEY);
  return safeParse(raw);
};

const persistHistory = (entries) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
};

export const addToViewHistory = (product = {}) => {
  if (typeof window === "undefined") return;
  const slug = product.slug || product._id?.toString?.();
  if (!slug) return;

  const now = Date.now();
  const current = loadViewHistory();
  const filtered = current.filter(
    (item) => item.slug !== slug && item._id !== product._id
  );

  const entry = {
    ...product,
    slug,
    lastViewed: now,
  };

  const next = [entry, ...filtered].slice(0, MAX_ITEMS);
  persistHistory(next);
  return next;
};

export const clearViewHistory = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(HISTORY_KEY);
};
