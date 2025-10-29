const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const assetBaseUrl = API_BASE_URL.replace(/\/api\/?$/, "");

export const getAssetUrl = (path) => {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${assetBaseUrl}${normalized}`;
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
