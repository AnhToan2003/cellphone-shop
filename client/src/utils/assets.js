const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "/api" : "http://localhost:5000/api");

const assetBaseUrl = API_BASE_URL.replace(/\/api\/?$/, "");

const optimizeLocalUploadPath = (path) => {
  if (!import.meta.env.PROD) return path;
  return path.replace(
    /^(\/uploads\/(?:products|banners)\/[^?#]+)\.(?:jpe?g|png)(?=([?#]|$))/i,
    "$1.webp$2"
  );
};

export const getAssetUrl = (path) => {
  if (!path) {
    return "";
  }

  if (/^(?:https?:\/\/|data:|blob:)/i.test(path)) {
    if (!/^https?:\/\//i.test(path)) return path;
    try {
      const url = new URL(path);
      if (
        import.meta.env.PROD &&
        /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url.host) &&
        url.pathname.startsWith("/uploads/")
      ) {
        return optimizeLocalUploadPath(url.pathname);
      }
    } catch {
      return path;
    }
    return path;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${assetBaseUrl}${optimizeLocalUploadPath(normalized)}`;
};

export const getProductImage = (product, fallback) => {
  if (!product) {
    return fallback || "";
  }

  const images = Array.isArray(product.images) ? product.images : [];
  const candidate = product.imageUrl || images[0] || fallback || "";
  const resolved = getAssetUrl(candidate);

  return resolved || fallback || "";
};

export default getAssetUrl;
