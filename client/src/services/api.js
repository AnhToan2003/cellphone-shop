import { apiClient } from "../api/axios.js";

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });
  const raw = query.toString();
  return raw ? `?${raw}` : "";
};

export const loginRequest = (payload) =>
  apiClient.post("/auth/login", payload);

export const fetchAdminOverview = () => apiClient.get("/admin/overview");

export const fetchAdminUsers = () => apiClient.get("/admin/users");

export const fetchAdminUserRankings = (params = {}) =>
  apiClient.get(`/admin/users/rankings${buildQueryString(params)}`);

export const updateAdminUserRole = (userId, payload) =>
  apiClient.patch(`/admin/users/${userId}`, payload);

export const updateAdminUserRanking = (userId, payload) =>
  apiClient.patch(`/admin/users/${userId}/ranking`, payload);

export const deleteAdminUser = (userId) =>
  apiClient.delete(`/admin/users/${userId}`);

export const fetchAdminProducts = (params = {}) =>
  apiClient.get(`/admin/products${buildQueryString(params)}`);

export const uploadAdminProductImage = (formData) =>
  apiClient.post("/admin/products/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const createAdminProduct = (payload) =>
  apiClient.post("/admin/products", payload);

export const updateAdminProduct = (productId, payload) =>
  apiClient.put(`/admin/products/${productId}`, payload);

export const deleteAdminProduct = (productId) =>
  apiClient.delete(`/admin/products/${productId}`);

export const fetchAdminPromotions = () => apiClient.get("/admin/promotions");

export const createAdminPromotion = (payload) =>
  apiClient.post("/admin/promotions", payload);

export const updateAdminPromotion = (promotionId, payload) =>
  apiClient.patch(`/admin/promotions/${promotionId}`, payload);

export const deleteAdminPromotion = (promotionId) =>
  apiClient.delete(`/admin/promotions/${promotionId}`);

export const updateProfileRequest = (payload) =>
  apiClient.patch("/auth/me", payload);

export const fetchProductReviews = (slug) =>
  apiClient.get(`/products/${slug}/reviews`);

export const createProductReview = (slug, payload) =>
  apiClient.post(`/products/${slug}/reviews`, payload);

export const fetchAdminOrders = () => apiClient.get("/orders");

export const updateAdminOrderStatus = (orderId, payload) =>
  apiClient.patch(`/orders/${orderId}/status`, payload);

export const cancelMyOrder = (orderId) =>
  apiClient.patch(`/orders/${orderId}/cancel`);

export const confirmMyOrderPayment = (orderId, config = undefined) =>
  apiClient.patch(
    `/orders/${orderId}/payment/confirm`,
    undefined,
    config
  );

export const fetchMyWarrantyItems = () =>
  apiClient.get("/orders/me/warranty");

export const fetchLatestProducts = (limit = 5) =>
  apiClient.get(`/products${buildQueryString({ limit })}`);

export const fetchPublicProducts = (params = {}) =>
  apiClient.get(`/products${buildQueryString(params)}`);

export const fetchHomeCategories = () =>
  apiClient.get("/home-categories");

export const fetchBrands = () => apiClient.get("/brands");

export const fetchAdminHomeCategories = () =>
  apiClient.get("/admin/home-categories");

export const createAdminHomeCategory = (payload) =>
  apiClient.post("/admin/home-categories", payload);

export const updateAdminHomeCategory = (categoryId, payload) =>
  apiClient.patch(`/admin/home-categories/${categoryId}`, payload);

export const deleteAdminHomeCategory = (categoryId) =>
  apiClient.delete(`/admin/home-categories/${categoryId}`);

export const fetchAdminBrands = () => apiClient.get("/admin/brands");

export const createAdminBrand = (payload) =>
  apiClient.post("/admin/brands", payload);

export const updateAdminBrand = (brandId, payload) =>
  apiClient.patch(`/admin/brands/${brandId}`, payload);

export const deleteAdminBrand = (brandId) =>
  apiClient.delete(`/admin/brands/${brandId}`);

export const sendSupportMessage = (payload) =>
  apiClient.post("/support/chat", payload);

export default apiClient;
