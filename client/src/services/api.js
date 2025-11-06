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

export const updateAdminUserRole = (userId, payload) =>
  apiClient.patch(`/admin/users/${userId}`, payload);

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

export const confirmMyOrderPayment = (orderId) =>
  apiClient.patch(`/orders/${orderId}/payment/confirm`);

export const fetchMyWarrantyItems = () =>
  apiClient.get("/orders/me/warranty");

export const fetchLatestProducts = (limit = 5) =>
  apiClient.get(`/products${buildQueryString({ limit })}`);

export default apiClient;
