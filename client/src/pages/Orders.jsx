import { useCallback, useEffect, useMemo, useState } from "react";
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

const PAYMENT_METHOD_LABELS = {
  cod: "Thanh toán khi nhận hàng",
  vietqr: "Thanh toán VietQR",
};

const VIETQR_STATUS_LABELS = {
  pending: "Chưa thanh toán",
  awaiting: "Đang chờ chuyển khoản",
  completed: "Đã thanh toán",
  failed: "Thanh toán thất bại",
};

const REVIEWABLE_STATUSES = ["processing", "shipping", "shipped", "delivered"];

const buildItemReviewKey = (orderId, item, fallbackIndex = 0) => {
  const rawOrder =
    typeof orderId === "string"
      ? orderId
      : orderId && typeof orderId.toString === "function"
      ? orderId.toString()
      : "";

  const productRef = item?.product ?? item;

  const productId =
    typeof productRef?._id === "string"
      ? productRef._id
      : productRef?._id && typeof productRef._id.toString === "function"
      ? productRef._id.toString()
      : typeof productRef === "string"
      ? productRef
      : "";

  const productSlug =
    typeof productRef?.slug === "string"
      ? productRef.slug
      : typeof item?.slug === "string"
      ? item.slug
      : "";

  if (rawOrder && productId) {
    return `${rawOrder}:${productId}`;
  }

  if (rawOrder && productSlug) {
    return `${rawOrder}:${productSlug}`;
  }

  return `${rawOrder || "order"}:${productId || productSlug || fallbackIndex}`;
};

const Orders = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  const { items: orders = [], status } = useSelector((state) => state.orders);

  const [cancellingId, setCancellingId] = useState(null);
  const [activeReview, setActiveReview] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewedKeys, setReviewedKeys] = useState(() => new Set());

  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(fetchMyOrders());
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (!Array.isArray(orders)) return;
    setReviewedKeys((previous) => {
      const next = new Set(previous);
      orders.forEach((order) => {
        const orderId =
          order?._id && typeof order._id.toString === "function"
            ? order._id.toString()
            : order?._id || "";
        (order?.items || []).forEach((item, index) => {
          const key = buildItemReviewKey(orderId, item, index);
          if (item?.alreadyReviewed && key) {
            next.add(key);
          }
        });
      });
      return next;
    });
  }, [orders]);

  const isLoading = status === "loading" && (!orders || orders.length === 0);

  const handleCancelOrder = useCallback(
    async (orderId) => {
      if (!orderId) return;
      setCancellingId(orderId);
      try {
        await cancelMyOrder(orderId);
        toast.success("Đã hủy đơn hàng thành công");
        dispatch(fetchMyOrders());
      } catch (error) {
        const message =
          error?.response?.data?.message || "Không thể hủy đơn hàng";
        toast.error(message);
      } finally {
        setCancellingId(null);
      }
    },
    [dispatch]
  );

  const handleOpenReview = useCallback((order, item, index) => {
    if (!order || !item) return;
    const orderId =
      order?._id && typeof order._id.toString === "function"
        ? order._id.toString()
        : order?._id || "";
    const product = item?.product ?? item;
    const productSlug =
      (typeof product?.slug === "string" && product.slug) ||
      (typeof item?.slug === "string" && item.slug) ||
      "";

    if (!productSlug) {
      toast.error("Không tìm thấy thông tin sản phẩm để đánh giá");
      return;
    }

    const key = buildItemReviewKey(orderId, item, index);

    setActiveReview({
      orderId,
      orderCode: orderId ? orderId.slice(-8).toUpperCase() : "",
      productSlug,
      productName:
        product?.name || item?.name || "Sản phẩm chưa xác định",
      image:
        (Array.isArray(product?.images) && product.images[0]) ||
        item?.image ||
        "",
      key,
    });
    setReviewForm({ rating: 5, comment: "" });
  }, []);

  const handleCloseReview = useCallback(() => {
    if (reviewing) return;
    setActiveReview(null);
    setReviewForm({ rating: 5, comment: "" });
  }, [reviewing]);

  const handleSubmitReview = useCallback(
    async (event) => {
      event.preventDefault();
      if (!activeReview) return;

      try {
        setReviewing(true);
        await createProductReview(activeReview.productSlug, {
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          orderId: activeReview.orderId,
        });
        toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
        setReviewedKeys((previous) => {
          const next = new Set(previous);
          if (activeReview.key) {
            next.add(activeReview.key);
          }
          return next;
        });
        setActiveReview(null);
        setReviewForm({ rating: 5, comment: "" });
      } catch (error) {
        const message =
          error?.response?.data?.message || "Không thể gửi đánh giá";
        toast.error(message);
      } finally {
        setReviewing(false);
      }
    },
    [activeReview, reviewForm.comment, reviewForm.rating]
  );

  const renderOrderHeader = (order) => {
    const createdAt = order?.createdAt
      ? new Date(order.createdAt).toLocaleString("vi-VN")
      : "";
    const orderCode = order?._id
      ? `#${order._id.toString().slice(-8).toUpperCase()}`
      : "Không xác định";
    const statusMeta = STATUS_META[order?.status] || {
      label: order?.status || "Không xác định",
      tone: "bg-slate-200 text-slate-700",
    };
    const canCancel = order?.status === "pending";

    return (
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Mã đơn hàng
          </p>
          <p className="text-lg font-semibold text-slate-900">{orderCode}</p>
        </div>
        <div className="flex flex-col text-right text-xs text-slate-500 sm:text-sm">
          {createdAt && <span>Đặt lúc {createdAt}</span>}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide ${statusMeta.tone}`}
          >
            {statusMeta.label}
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
    );
  };

  const renderOrderItems = (order) => {
    const items = Array.isArray(order?.items) ? order.items : [];

    return (
      <div className="space-y-3">
        {items.map((item, index) => {
          const product = item?.product ?? item;
          const productSlug =
            (typeof product?.slug === "string" && product.slug) ||
            (typeof item?.slug === "string" && item.slug) ||
            "";
          const productLink = productSlug ? `/products/${productSlug}` : "#";
          const key = buildItemReviewKey(order?._id, item, index);
          const alreadyReviewed = Boolean(item?.alreadyReviewed);
          const hasReviewed =
            alreadyReviewed || (key && reviewedKeys.has(key));
          const canReviewStatus = REVIEWABLE_STATUSES.includes(order?.status);
          const canReview =
            canReviewStatus && !hasReviewed && Boolean(productSlug);

          const image =
            (Array.isArray(product?.images) && product.images[0]) ||
            item?.image ||
            "";

          return (
            <div
              key={`${order?._id || "order"}-${productSlug || index}`}
              className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                {image ? (
                  <img
                    src={image}
                    alt={product?.name || item?.name}
                    className="h-16 w-16 flex-shrink-0 rounded-xl border border-slate-100 object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 flex-shrink-0 rounded-xl border border-dashed border-slate-200 bg-slate-100" />
                )}
                <div className="space-y-1">
                  <Link
                    to={productLink}
                    className="inline-flex text-sm font-semibold text-slate-900 hover:text-brand-primary"
                  >
                    {product?.name || item?.name || "Sản phẩm"}
                  </Link>
                  <p className="text-xs text-slate-500">
                    Số lượng: {item?.quantity || 1}
                  </p>
                  {(item?.color || item?.capacity) && (
                    <p className="text-xs text-slate-400">
                      {item?.color ? `Màu: ${item.color}` : ""}
                      {item?.color && item?.capacity ? " • " : ""}
                      {item?.capacity ? `Dung lượng: ${item.capacity}` : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <span className="text-sm font-semibold text-slate-800">
                  {currency((item?.price || 0) * (item?.quantity || 1))}
                </span>
                {canReview && (
                  <button
                    type="button"
                    onClick={() => handleOpenReview(order, item, index)}
                    className="rounded-full border border-brand-primary px-4 py-1 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                  >
                    Gửi đánh giá
                  </button>
                )}
                {hasReviewed && (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
                    Bạn đã đánh giá
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderOrderSummary = (order) => {
    const payment = order?.payment || {};
    const paymentMethod = order?.paymentMethod || "cod";
    const paymentMethodLabel =
      PAYMENT_METHOD_LABELS[paymentMethod] || PAYMENT_METHOD_LABELS.cod;
    const paymentStatusLabel =
      paymentMethod === "vietqr"
        ? VIETQR_STATUS_LABELS[payment.status] ||
          VIETQR_STATUS_LABELS.pending
        : PAYMENT_METHOD_LABELS.cod;
    const paymentReference =
      typeof payment.reference === "string" ? payment.reference.trim() : "";
    const paymentTransferContent =
      typeof payment.transferContent === "string"
        ? payment.transferContent.trim()
        : "";
    const paymentConfirmedAt = payment?.confirmedAt
      ? new Date(payment.confirmedAt).toLocaleString("vi-VN")
      : null;
    const paymentMessage =
      typeof payment.message === "string" ? payment.message.trim() : "";

    const shippingInfo = order?.shippingInfo || {};
    const shippingDetails = [
      shippingInfo.fullName
        ? { label: "Người nhận", value: shippingInfo.fullName }
        : null,
      shippingInfo.phone
        ? { label: "Số điện thoại", value: shippingInfo.phone }
        : null,
      shippingInfo.address
        ? { label: "Địa chỉ", value: shippingInfo.address }
        : null,
    ].filter(Boolean);

    const totals = order?.totals || {};
    const itemsTotal = totals?.items || 0;
    const shippingFee = totals?.shipping || 0;
    const grandTotal = totals?.grand || itemsTotal + shippingFee;

    return (
      <div className="space-y-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Thông tin giao hàng
          </p>
          <div className="mt-2 space-y-2 text-sm text-slate-600">
            {shippingDetails.length ? (
              shippingDetails.map((detail) => (
                <p key={detail.label}>
                  <span className="font-semibold text-slate-800">
                    {detail.label}:
                  </span>{" "}
                  {detail.value}
                </p>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Chưa có thông tin giao hàng.
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Thông tin thanh toán
          </p>
          <div className="mt-2 space-y-2 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-800">
                Phương thức:
              </span>{" "}
              {paymentMethodLabel}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Trạng thái:</span>{" "}
              {paymentStatusLabel}
            </p>
            {paymentReference && (
              <p>
                <span className="font-semibold text-slate-800">
                  Mã tham chiếu:
                </span>{" "}
                <span className="font-mono text-xs">{paymentReference}</span>
              </p>
            )}
            {paymentTransferContent && (
              <div>
                <p>
                  <span className="font-semibold text-slate-800">
                    Nội dung chuyển khoản:
                  </span>
                </p>
                <p className="overflow-hidden text-ellipsis font-mono text-xs text-slate-500">
                  {paymentTransferContent}
                </p>
              </div>
            )}
            {paymentConfirmedAt && (
              <p>
                <span className="font-semibold text-slate-800">
                  Xác nhận lúc:
                </span>{" "}
                {paymentConfirmedAt}
              </p>
            )}
            {paymentMessage && (
              <p className="text-xs text-slate-500">{paymentMessage}</p>
            )}
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Tạm tính</span>
              <span>{currency(itemsTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Phí vận chuyển</span>
              <span>{currency(shippingFee)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-slate-900">
              <span>Thành tiền</span>
              <span>{currency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    if (!orders || orders.length === 0) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
          <p className="text-base font-medium">
            Bạn chưa có đơn hàng nào.{" "}
            <Link to="/" className="text-brand-primary hover:underline">
              Tiếp tục mua sắm
            </Link>
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {orders.map((order, index) => (
          <div
            key={
              (order?._id && typeof order._id.toString === "function"
                ? order._id.toString()
                : order?._id) ||
              order?.createdAt ||
              `order-${index}`
            }
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            {renderOrderHeader(order)}
            <div className="grid gap-6 pt-4 lg:grid-cols-[1.5fr,1fr]">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Danh sách sản phẩm
                </p>
                {renderOrderItems(order)}
              </div>
              {renderOrderSummary(order)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const loadingPlaceholder = useMemo(
    () => (
      <div className="space-y-6">
        {[1, 2].map((index) => (
          <div
            key={index}
            className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6"
          >
            <div className="mb-4 h-10 rounded-2xl bg-slate-200" />
            <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-24 rounded-2xl border border-slate-100 bg-slate-100"
                  />
                ))}
              </div>
              <div className="h-48 rounded-2xl border border-slate-100 bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    ),
    []
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans">
      <div className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6 lg:px-0">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Đơn hàng của bạn
            </h1>
            <p className="text-sm text-slate-500">
              Theo dõi trạng thái đơn hàng và gửi đánh giá cho từng sản phẩm đã
              mua.
            </p>
          </div>
        </div>

        {isLoading ? loadingPlaceholder : renderOrders()}
      </div>

      {activeReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              {activeReview.image ? (
                <img
                  src={activeReview.image}
                  alt={activeReview.productName}
                  className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl border border-dashed border-slate-200 bg-slate-100" />
              )}
              <div className="flex-1">
                <h2 className="text-base font-semibold text-slate-900">
                  {activeReview.productName}
                </h2>
                {activeReview.orderCode && (
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Mã đơn {activeReview.orderCode}
                  </p>
                )}
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
    </div>
  );
};

export default Orders;
