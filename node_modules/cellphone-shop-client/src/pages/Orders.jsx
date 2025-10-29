import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

import { fetchMyOrders } from "../store/slices/orderSlice.js";
import { cancelMyOrder, createProductReview } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const currency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const STATUS_META = {
  pending: { label: "Chờ xác nhận", tone: "bg-amber-100 text-amber-600" },
  processing: { label: "Đã duyệt", tone: "bg-emerald-100 text-emerald-600" },
  shipping: { label: "Đang giao", tone: "bg-blue-100 text-blue-600" },
  shipped: { label: "Đang giao", tone: "bg-blue-100 text-blue-600" },
  delivered: { label: "Đã giao", tone: "bg-slate-200 text-slate-700" },
  cancelled: { label: "Đã hủy", tone: "bg-rose-100 text-rose-600" },
};

const Orders = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { items, status } = useSelector((state) => state.orders);

  const [cancellingId, setCancellingId] = useState(null);
  const [activeReview, setActiveReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewing, setReviewing] = useState(false);
  const [reviewedProducts, setReviewedProducts] = useState(() => new Set());

  const storageKey = user?._id ? `cellphones_reviews_${user._id}` : null;

  const persistReviewedProducts = useCallback(
    (nextSet) => {
      if (!storageKey || typeof window === "undefined") return;
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify(Array.from(nextSet))
        );
      } catch {
        // Bỏ qua lỗi localStorage khi người dùng bật chế độ private.
      }
    },
    [storageKey]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      setReviewedProducts(new Set());
      return;
    }

    if (!storageKey) {
      setReviewedProducts(new Set());
      return;
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setReviewedProducts(new Set());
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setReviewedProducts(new Set(parsed));
      } else {
        setReviewedProducts(new Set());
      }
    } catch {
      setReviewedProducts(new Set());
    }
  }, [storageKey]);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  useEffect(() => {
    if (!items?.length) {
      return;
    }

    setReviewedProducts((prev) => {
      let updated = false;
      const next = new Set(prev);

      items.forEach((order) => {
        const orderItems = Array.isArray(order?.items) ? order.items : [];
        orderItems.forEach((item) => {
          if (!item?.alreadyReviewed) return;
          const productId =
            item?.product?._id?.toString() ||
            (typeof item?.product === "string" ? item.product : "");
          const slug = item?.product?.slug || item?.slug || "";

          if (productId && !next.has(productId)) {
            next.add(productId);
            updated = true;
          }
          if (slug && !next.has(slug)) {
            next.add(slug);
            updated = true;
          }
        });
      });

      if (!updated) {
        return prev;
      }

      persistReviewedProducts(next);
      return next;
    });
  }, [items, persistReviewedProducts]);

  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);
    try {
      await cancelMyOrder(orderId);
      toast.success("Đơn hàng đã được hủy");
      dispatch(fetchMyOrders());
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể hủy đơn hàng. Vui lòng thử lại."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenReview = (order, item) => {
    const productId =
      item?.product?._id?.toString() ||
      (typeof item?.product === "string" ? item.product : "");
    const slug = item?.product?.slug || item?.slug || "";
    if (!slug) {
      toast.error("Không tìm thấy sản phẩm để đánh giá");
      return;
    }

    const imageSrc =
      item?.product?.images?.[0] ||
      item?.image ||
      "https://placehold.co/96x96?text=No+Image";

    const reviewKeys = [productId, slug].filter(Boolean);

    setActiveReview({
      orderId: order?._id,
      productId,
      productSlug: slug,
      productName: item?.name || item?.product?.name || "Sản phẩm",
      productKeys: reviewKeys,
      image: imageSrc,
    });
    setReviewForm({ rating: 5, comment: "" });
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    if (!activeReview?.productSlug) return;

    setReviewing(true);
    try {
      await createProductReview(activeReview.productSlug, {
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });
      toast.success("Gửi đánh giá thành công");

      const keysToAdd = Array.isArray(activeReview.productKeys)
        ? activeReview.productKeys
        : [activeReview.productId, activeReview.productSlug].filter(Boolean);

      if (keysToAdd.length) {
        setReviewedProducts((prev) => {
          const next = new Set(prev);
          keysToAdd.forEach((key) => next.add(key));
          persistReviewedProducts(next);
          return next;
        });
      }

      setActiveReview(null);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể gửi đánh giá. Vui lòng thử lại."
      );
    } finally {
      setReviewing(false);
    }
  };

  const handleCloseReview = () => {
    if (reviewing) return;
    setActiveReview(null);
  };

  if (status === "loading") {
    return (
      <div className="container-safe flex min-h-[40vh] flex-col items-center justify-center gap-4 py-16">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
        <p className="text-sm text-slate-500">Đang tải danh sách đơn hàng...</p>
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="container-safe flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Bạn chưa có đơn hàng nào
        </h1>
        <p className="max-w-md text-sm text-slate-500">
          Khám phá các sản phẩm mới nhất và đặt mua ngay để nhận ưu đãi hấp dẫn.
        </p>
        <Link
          to="/"
          className="rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Bắt đầu mua sắm
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="container-safe py-12">
        <div className="mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
            Lịch sử mua hàng
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Đơn hàng của bạn
          </h1>
          <p className="max-w-2xl text-sm text-slate-500">
            Theo dõi tiến độ giao hàng, xem chi tiết đơn và tải hóa đơn khi cần.
          </p>
        </div>

        <div className="space-y-6">
          {items.map((order) => {
            const createdAt = order.createdAt
              ? new Date(order.createdAt).toLocaleString("vi-VN")
              : "Không rõ";
            const totals = order.totals || {};
            const statusMeta = STATUS_META[order.status] || STATUS_META.pending;
            const displayStatus = order.statusLabel || statusMeta.label;
            const canCancel = order.status === "pending";
            const isDelivered = order.status === "delivered";

            return (
              <div
                key={order._id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Mã đơn hàng
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      #{order._id?.slice(-8)}
                    </p>
                  </div>
                  <div className="flex flex-col text-right text-sm text-slate-500">
                    <span>Đặt lúc {createdAt}</span>
                    <span>Tổng thanh toán: {currency(totals.grand)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide ${statusMeta.tone}`}
                    >
                      {displayStatus}
                    </span>
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={cancellingId === order._id}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-500 transition hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {cancellingId === order._id ? "Đang hủy..." : "Hủy đơn"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 pt-4 lg:grid-cols-[1.5fr,1fr]">
                  <div className="space-y-4">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Danh sách sản phẩm
                    </p>
                    <div className="space-y-3">
                      {order.items?.map((item) => {
                        const productId =
                          item?.product?._id?.toString() ||
                          (typeof item?.product === "string"
                            ? item.product
                            : "");
                        const productSlug =
                          item?.product?.slug || item?.slug || "";
                        const alreadyReviewed = Boolean(item?.alreadyReviewed);
                        const hasReviewed =
                          alreadyReviewed ||
                          (productId && reviewedProducts.has(productId)) ||
                          (productSlug && reviewedProducts.has(productSlug));

                        return (
                          <div
                            key={`${order._id}-${item.product}-${item.name}`}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-900">
                                {item.name}
                              </span>
                              <span className="text-xs text-slate-500">
                                Số lượng: {item.quantity}
                              </span>
                              {(item.color || item.capacity) && (
                                <span className="text-xs text-slate-400">
                                  {item.color ? `Màu: ${item.color}` : ""}
                                  {item.color && item.capacity ? " • " : ""}
                                  {item.capacity
                                    ? `Dung lượng: ${item.capacity}`
                                    : ""}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-sm font-semibold text-slate-700">
                                {currency(item.price * item.quantity)}
                              </span>
                              {isDelivered && productSlug && !hasReviewed && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReview(order, item)}
                                  className="rounded-full border border-brand-primary px-4 py-1 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                                >
                                  Gửi đánh giá
                                </button>
                              )}
                              {isDelivered && hasReviewed && (
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
                                  Bạn đã đánh giá
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Thông tin giao hàng
                    </p>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p>
                        <span className="font-semibold text-slate-800">
                          Người nhận:
                        </span>{" "}
                        {order.shippingInfo?.fullName || "Không rõ"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">
                          Điện thoại:
                        </span>{" "}
                        {order.shippingInfo?.phone || "Không rõ"}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">
                          Địa chỉ:
                        </span>{" "}
                        {order.shippingInfo?.address || "Không rõ"}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Tổng sản phẩm</span>
                        <span>{currency(totals.items)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phí vận chuyển</span>
                        <span>{currency(totals.shipping)}</span>
                      </div>
                      <div className="flex justify-between text-base font-semibold text-slate-900">
                        <span>Thành tiền</span>
                        <span>{currency(totals.grand)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activeReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <img
                src={activeReview.image}
                alt={activeReview.productName}
                className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
              />
              <div className="flex-1">
                <h2 className="text-base font-semibold text-slate-900">
                  {activeReview.productName}
                </h2>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Mã đơn #{activeReview.orderId?.slice(-8)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseReview}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Đóng"
              >
                <span className="block text-lg leading-none">&times;</span>
              </button>
            </div>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="order-review-rating"
                  className="text-sm font-medium text-slate-700"
                >
                  Đánh giá của bạn
                </label>
                <select
                  id="order-review-rating"
                  value={reviewForm.rating}
                  onChange={(event) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      rating: Number(event.target.value),
                    }))
                  }
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} sao
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={reviewForm.comment}
                onChange={(event) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    comment: event.target.value,
                  }))
                }
                rows={4}
                placeholder="Chia sẻ cảm nhận của bạn..."
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseReview}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={reviewing}
                  className="rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand-dark/50"
                >
                  {reviewing ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Orders;
