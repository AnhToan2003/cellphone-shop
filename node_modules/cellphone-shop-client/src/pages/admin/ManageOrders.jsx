import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import {
  fetchAdminOrders,
  updateAdminOrderStatus,
} from "../../services/api.js";

const STATUS_META = {
  pending: { label: "Chờ xác nhận", tone: "bg-amber-100 text-amber-600" },
  processing: { label: "Đã duyệt", tone: "bg-emerald-100 text-emerald-600" },
  shipped: { label: "Đang giao", tone: "bg-blue-100 text-blue-600" },
  delivered: { label: "Đã giao", tone: "bg-slate-200 text-slate-700" },
  cancelled: { label: "Đã hủy", tone: "bg-rose-100 text-rose-600" },
};

const currency = (value = 0) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data } = await fetchAdminOrders();
      const items = Array.isArray(data?.data) ? data.data : [];
      setOrders(items);
    } catch (error) {
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (order, status) => {
    if (updatingId) return;
    setUpdatingId(order._id);
    try {
      const { data } = await updateAdminOrderStatus(order._id, { status });
      if (data?.success) {
        setOrders((prev) =>
          prev.map((item) => (item._id === order._id ? data.data : item))
        );
        toast.success(
          status === "delivered"
            ? "Đơn hàng đã được giao"
            : status === "cancelled"
            ? "Đơn hàng đã bị từ chối"
            : "Cập nhật trạng thái thành công"
        );
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Cập nhật thất bại";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-primary">
          Đơn hàng
        </p>
        <h1 className="text-3xl font-semibold text-white">
          Quản lý đơn hàng khách hàng
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Theo dõi đơn mới, phê duyệt đơn hợp lệ hoặc từ chối khi thông tin chưa
          đầy đủ.
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-slate-950/40">
        <div className="grid grid-cols-12 bg-slate-900/80 px-5 py-3 text-xs uppercase tracking-wide text-slate-500">
          <span className="col-span-3">Khách hàng</span>
          <span className="col-span-3">Địa chỉ giao</span>
          <span className="col-span-2 text-right">Tổng tiền</span>
          <span className="col-span-2 text-center">Trạng thái</span>
          <span className="col-span-2 text-right">Thao tác</span>
        </div>
        {loading ? (
          <div className="space-y-3 px-5 py-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-800" />
            ))}
          </div>
        ) : orders.length ? (
          <div className="divide-y divide-slate-800">
            {orders.map((order) => {
              const meta = STATUS_META[order.status] || STATUS_META.pending;
              const displayStatus = order.statusLabel || meta.label;
              return (
                <div
                  key={order._id}
                  className="grid grid-cols-12 gap-4 px-5 py-5 text-sm text-slate-200"
                >
                  <div className="col-span-3">
                    <p className="font-semibold text-white">
                      {order.user?.name || order.shippingInfo?.fullName || "Không rõ"}
                    </p>
                    <p className="text-xs text-slate-500">{order.user?.email}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="col-span-3 space-y-1 text-slate-400">
                    <p>{order.shippingInfo?.address}</p>
                    <p>SĐT: {order.shippingInfo?.phone}</p>
                    <p>Thanh toán: {order.paymentMethod?.toUpperCase?.()}</p>
                  </div>
                  <div className="col-span-2 text-right font-semibold text-slate-100">
                    {currency(order.totals?.grand)}
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${meta.tone}`}
                    >
                      {displayStatus}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col items-end gap-2">
                    {order.status === "pending" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order, "delivered")}
                          disabled={updatingId === order._id}
                          className="w-full rounded-full border border-emerald-400 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updatingId === order._id ? "Đang xử lý..." : "Giao hàng"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order, "cancelled")}
                          disabled={updatingId === order._id}
                          className="w-full rounded-full border border-red-400 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Từ chối
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500">Đã xử lý</span>
                    )}
                  </div>
                  <div className="col-span-12 mt-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                    <h4 className="text-xs uppercase tracking-wide text-slate-500">
                      Chi tiết sản phẩm
                    </h4>
                    <div className="mt-3 space-y-2">
                      {order.items?.map((item) => (
                        <div
                          key={`${order._id}-${item.product}`}
                          className="flex items-center justify-between text-sm text-slate-300"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image || item.product?.images?.[0]}
                              alt={item.name}
                              className="h-12 w-12 rounded-lg border border-slate-800 object-cover"
                            />
                            <div>
                              <p className="font-medium text-white">{item.name}</p>
                              <p className="text-xs text-slate-500">
                                Số lượng: {item.quantity}
                              </p>
                              {(item.color || item.capacity) && (
                                <p className="text-xs text-slate-500">
                                  {item.color ? `Màu: ${item.color}` : ""}
                                  {item.color && item.capacity ? " • " : ""}
                                  {item.capacity ? `Dung lượng: ${item.capacity}` : ""}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="font-semibold text-brand-primary">
                            {currency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-slate-400">
            Chưa có đơn hàng nào.
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageOrders;
