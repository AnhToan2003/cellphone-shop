import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FiCheckCircle,
  FiClock,
  FiHome,
  FiPackage,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

import { fetchAdminOrders, updateAdminOrderStatus } from "../../services/api.js";
import { getAssetUrl } from "../../utils/assets.js";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Filters state
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all"); // "all" | "cod" | "store"
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  const [searchTerm, setSearchTerm] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data } = await fetchAdminOrders();
      const items = Array.isArray(data?.data) ? data.data : [];
      setOrders(items);
    } catch {
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (order, newStatus) => {
    if (updatingId) return;
    setUpdatingId(order._id);
    try {
      const { data } = await updateAdminOrderStatus(order._id, { status: newStatus });
      if (data?.success) {
        setOrders((prev) =>
          prev.map((item) => (item._id === order._id ? data.data : item))
        );

        const isStore = order.paymentMethod === "store";
        if (newStatus === "delivered") {
          toast.success(
            isStore
              ? "Đã xác nhận khách nhận máy thành công tại Showroom!"
              : "Đã cập nhật giao hàng & thu tiền COD thành công!"
          );
        } else if (newStatus === "processing") {
          toast.success(
            isStore
              ? "Đã chuyển trạng thái: Máy sẵn sàng tại showroom!"
              : "Đã chuyển trạng thái: Đang chuẩn bị hàng!"
          );
        } else if (newStatus === "shipped") {
          toast.success("Đã bàn giao đơn hàng cho Shipper đi giao!");
        } else if (newStatus === "cancelled") {
          toast.success("Đã hủy đơn hàng.");
        } else {
          toast.success("Đã cập nhật trạng thái đơn hàng.");
        }
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Cập nhật thất bại";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    let codCount = 0;
    let codPending = 0;
    let storeCount = 0;
    let storePending = 0;
    let totalRevenue = 0;

    orders.forEach((o) => {
      const isStore = o.paymentMethod === "store";
      if (isStore) {
        storeCount += 1;
        if (o.status === "pending") storePending += 1;
      } else {
        codCount += 1;
        if (o.status === "pending") codPending += 1;
      }

      if (o.status === "delivered") {
        totalRevenue += Number(o.totals?.grand || 0);
      }
    });

    return {
      total: orders.length,
      codCount,
      codPending,
      storeCount,
      storePending,
      totalRevenue,
    };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Fulfillment filter
      if (fulfillmentFilter === "cod" && order.paymentMethod === "store") return false;
      if (fulfillmentFilter === "store" && order.paymentMethod !== "store") return false;

      // 2. Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "in_progress") {
          if (!["processing", "shipped"].includes(order.status)) return false;
        } else if (order.status !== statusFilter) {
          return false;
        }
      }

      // 3. Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const orderCode = (order._id || "").toLowerCase();
        const customerName = (order.shippingInfo?.fullName || order.user?.name || "").toLowerCase();
        const phone = (order.shippingInfo?.phone || "").toLowerCase();
        const address = (order.shippingInfo?.address || "").toLowerCase();

        return (
          orderCode.includes(query) ||
          customerName.includes(query) ||
          phone.includes(query) ||
          address.includes(query)
        );
      }

      return true;
    });
  }, [orders, fulfillmentFilter, statusFilter, searchTerm]);

  return (
    <div className="space-y-8 font-sans">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-blue-400 font-bold">
            Quản Trị Bán Hàng
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-white">
            Quản Lý Đơn Hàng (Ship COD &amp; Nhận Tại Cửa Hàng)
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Theo dõi, phân luồng chuẩn xác giữa đơn giao tận nơi (COD) và đơn khách nhận trực tiếp tại showroom Ngọc Triết Store.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition shadow-sm"
        >
          <FiRefreshCw className={loading ? "animate-spin text-blue-400" : ""} />
          <span>Làm mới danh sách</span>
        </button>
      </header>

      {/* METRICS SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Orders */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tổng số đơn hàng
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-white">
              <FiPackage size={18} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-white">{metrics.total}</p>
          <p className="mt-1 text-xs text-slate-500">Toàn bộ đơn phát sinh trên hệ thống</p>
        </div>

        {/* COD Orders */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Đơn Ship COD
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/30 text-emerald-300">
              <FiTruck size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-emerald-300">{metrics.codCount}</p>
            {metrics.codPending > 0 && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/40">
                {metrics.codPending} chờ duyệt
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">Giao hàng tận nhà &amp; thu tiền mặt</p>
        </div>

        {/* Store Pickup Orders */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Nhận tại Showroom
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/30 text-blue-300">
              <FiHome size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-blue-300">{metrics.storeCount}</p>
            {metrics.storePending > 0 && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/40">
                {metrics.storePending} chờ chuẩn bị
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">Khách ghé showroom test máy</p>
        </div>

        {/* Total Revenue */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Doanh thu hoàn tất
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/30 text-purple-300 text-sm font-bold">
              ₫
            </span>
          </div>
          <p className="mt-3 text-xl sm:text-2xl font-extrabold text-purple-300 truncate">
            {formatCurrency(metrics.totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Từ các đơn đã giao / khách đã nhận</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Fulfillment Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => setFulfillmentFilter("all")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              fulfillmentFilter === "all"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tất cả ({metrics.total})
          </button>
          <button
            type="button"
            onClick={() => setFulfillmentFilter("cod")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              fulfillmentFilter === "cod"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-emerald-400"
            }`}
          >
            <FiTruck size={13} />
            <span>Ship COD ({metrics.codCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFulfillmentFilter("store")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              fulfillmentFilter === "store"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-blue-400"
            }`}
          >
            <FiHome size={13} />
            <span>Tại Showroom ({metrics.storeCount})</span>
          </button>
        </div>

        {/* Status Dropdown & Search Input */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-medium text-slate-200 outline-none transition focus:border-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">⏳ Chờ xử lý (Pending)</option>
            <option value="in_progress">📦 Đang giao / Sẵn sàng máy</option>
            <option value="delivered">✅ Đã hoàn tất (Delivered)</option>
            <option value="cancelled">❌ Đã hủy (Cancelled)</option>
          </select>

          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, SĐT, mã đơn..."
              className="w-full sm:w-60 rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-2xl bg-slate-900/60 border border-slate-800" />
            ))}
          </div>
        ) : filteredOrders.length ? (
          filteredOrders.map((order) => {
            const isStore = order.paymentMethod === "store";
            const isPending = order.status === "pending";
            const isProcessing = order.status === "processing";
            const isShipped = order.status === "shipped";
            const isDelivered = order.status === "delivered";
            const isCancelled = order.status === "cancelled";

            // Status Badge Config
            let statusText = order.statusLabel || "Chờ xử lý";
            let statusBadgeClass = "bg-amber-500/15 text-amber-300 border-amber-500/30";

            if (isStore) {
              if (isPending) {
                statusText = "Chờ chuẩn bị máy";
                statusBadgeClass = "bg-amber-500/15 text-amber-300 border-amber-500/30";
              } else if (isProcessing || isShipped) {
                statusText = "Máy sẵn sàng tại Showroom";
                statusBadgeClass = "bg-blue-500/15 text-blue-300 border-blue-500/30";
              } else if (isDelivered) {
                statusText = "Khách đã nhận máy";
                statusBadgeClass = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
              } else if (isCancelled) {
                statusText = "Đã hủy giữ máy";
                statusBadgeClass = "bg-rose-500/15 text-rose-300 border-rose-500/30";
              }
            } else {
              if (isPending) {
                statusText = "Chờ xác nhận đơn";
                statusBadgeClass = "bg-amber-500/15 text-amber-300 border-amber-500/30";
              } else if (isProcessing) {
                statusText = "Đang chuẩn bị hàng";
                statusBadgeClass = "bg-blue-500/15 text-blue-300 border-blue-500/30";
              } else if (isShipped) {
                statusText = "Đang giao hàng (Ship COD)";
                statusBadgeClass = "bg-blue-500/15 text-blue-300 border-blue-500/30";
              } else if (isDelivered) {
                statusText = "Đã giao & thu tiền COD";
                statusBadgeClass = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
              } else if (isCancelled) {
                statusText = "Đã hủy đơn";
                statusBadgeClass = "bg-rose-500/15 text-rose-300 border-rose-500/30";
              }
            }

            return (
              <div
                key={order._id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg transition hover:border-slate-700"
              >
                {/* ORDER CARD HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/70 px-5 py-3.5 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-bold text-white tracking-wider">
                      #{order._id?.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </span>

                    {/* Fulfillment Method Badge */}
                    {isStore ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-500/40 px-2.5 py-0.5 font-bold text-blue-300">
                        <FiHome size={12} />
                        Nhận tại Showroom
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 font-bold text-emerald-300">
                        <FiTruck size={12} />
                        Giao hàng Ship COD
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-bold border ${statusBadgeClass}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                    {statusText}
                  </span>
                </div>

                {/* ORDER CARD BODY */}
                <div className="grid gap-6 p-5 lg:grid-cols-12">
                  {/* Left Column: Customer & Delivery Info */}
                  <div className="space-y-3 lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800/80 pb-4 lg:pb-0 lg:pr-5">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        Khách hàng
                      </p>
                      <h4 className="mt-1 text-base font-bold text-white">
                        {order.shippingInfo?.fullName || order.user?.name || "Khách vãng lai"}
                      </h4>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-blue-400 font-semibold">
                        <FiPhone size={13} />
                        <a href={`tel:${order.shippingInfo?.phone}`} className="hover:underline">
                          {order.shippingInfo?.phone || "Chưa có SĐT"}
                        </a>
                      </p>
                      {order.user?.email && (
                        <p className="text-xs text-slate-400 mt-0.5">{order.user.email}</p>
                      )}
                    </div>

                    {/* Delivery / Pickup Box */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs space-y-1">
                      {isStore ? (
                        <>
                          <p className="font-bold text-blue-400 flex items-center gap-1.5">
                            <FiHome /> Nhận tại Showroom Ngọc Triết Store
                          </p>
                          <p className="text-slate-300 leading-relaxed">
                            Khách hàng đến nhận máy, kiểm tra kỹ thuật &amp; thanh toán trực tiếp tại quầy.
                          </p>
                          <p className="text-[11px] text-slate-500 pt-0.5">
                            📞 Hotline showroom: 039 555 4268
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <FiTruck /> Địa chỉ nhận hàng COD
                          </p>
                          <p className="text-slate-200 font-medium leading-relaxed">
                            {order.shippingInfo?.address || "Chưa có địa chỉ"}
                          </p>
                          <p className="text-[11px] text-slate-400 pt-0.5">
                            Giao hàng toàn quốc • Đồng kiểm trước khi thanh toán
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Items List */}
                  <div className="space-y-3 lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-800/80 pb-4 lg:pb-0 lg:pr-5">
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Sản phẩm đặt mua ({order.items?.length || 0})
                    </p>
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {order.items?.map((item, idx) => (
                        <div
                          key={`${item.product?._id || item.product || idx}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/70 bg-slate-950/50 p-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={
                                getAssetUrl(item.image || item.product?.imageUrl || item.product?.images?.[0]) ||
                                "https://placehold.co/64x64?text=Apple"
                              }
                              alt={item.name}
                              className="h-11 w-11 shrink-0 rounded-lg border border-slate-800 bg-slate-900 object-contain p-1"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{item.name}</p>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                {item.color && (
                                  <span className="rounded bg-slate-800 px-1.5 py-0.2 text-slate-300">
                                    {item.color}
                                  </span>
                                )}
                                {item.capacity && (
                                  <span className="rounded bg-slate-800 px-1.5 py-0.2 text-slate-300">
                                    {item.capacity}
                                  </span>
                                )}
                                <span>× {item.quantity}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-extrabold text-blue-400 shrink-0">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Pricing & Action Controls */}
                  <div className="space-y-4 lg:col-span-3 flex flex-col justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        Chi phí &amp; Thanh toán
                      </p>
                      <div className="mt-2 space-y-1.5 text-xs text-slate-400">
                        <div className="flex justify-between">
                          <span>Tiền hàng:</span>
                          <span className="text-slate-200">
                            {formatCurrency(order.totals?.items || order.totals?.grand)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Phí vận chuyển:</span>
                          <span className={isStore ? "text-emerald-400 font-semibold" : "text-slate-200"}>
                            {isStore ? "Miễn phí (0₫)" : formatCurrency(order.totals?.shipping || 30000)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-extrabold text-white">
                          <span>Tổng thu:</span>
                          <span className="text-blue-400">
                            {formatCurrency(order.totals?.grand)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 pt-1">
                          Hình thức: {isStore ? "Thanh toán tại quầy Showroom" : "Thu tiền khi giao hàng (COD)"}
                        </p>
                      </div>
                    </div>

                    {/* CONTEXTUAL ACTION BUTTONS */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      {isStore ? (
                        /* Actions for Store Pickup */
                        isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, "processing")}
                              disabled={updatingId === order._id}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-50"
                            >
                              <FiPackage size={14} />
                              <span>Đã chuẩn bị máy sẵn sàng</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, "delivered")}
                              disabled={updatingId === order._id}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-600/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30 transition disabled:opacity-50"
                            >
                              <FiCheckCircle size={14} />
                              <span>Khách đã nhận máy &amp; thanh toán</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, "cancelled")}
                              disabled={updatingId === order._id}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 px-3.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50"
                            >
                              <FiXCircle size={13} />
                              <span>Hủy đơn giữ máy</span>
                            </button>
                          </>
                        ) : isProcessing || isShipped ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, "delivered")}
                              disabled={updatingId === order._id}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 disabled:opacity-50"
                            >
                              <FiCheckCircle size={14} />
                              <span>Khách đã nhận máy &amp; thanh toán</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, "cancelled")}
                              disabled={updatingId === order._id}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 px-3.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50"
                            >
                              <FiXCircle size={13} />
                              <span>Khách không đến nhận / Hủy đơn</span>
                            </button>
                          </>
                        ) : isDelivered ? (
                          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs font-bold text-emerald-400">
                            <FiCheckCircle />
                            <span>Đã hoàn tất tại Showroom</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-400">
                            <FiXCircle />
                            <span>Đã hủy giữ máy</span>
                          </div>
                        )
                      ) : (
                        /* Actions for Ship COD */
                        isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, "shipped")}
                              disabled={updatingId === order._id}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-50"
                            >
                              <FiTruck size={14} />
                              <span>Xác nhận &amp; Bàn giao Shipper</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, "delivered")}
                              disabled={updatingId === order._id}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-600/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30 transition disabled:opacity-50"
                            >
                              <FiCheckCircle size={14} />
                              <span>Đã giao &amp; Thu tiền COD</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, "cancelled")}
                              disabled={updatingId === order._id}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 px-3.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50"
                            >
                              <FiXCircle size={13} />
                              <span>Từ chối / Hủy đơn</span>
                            </button>
                          </>
                        ) : isProcessing || isShipped ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, "delivered")}
                              disabled={updatingId === order._id}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500 disabled:opacity-50"
                            >
                              <FiCheckCircle size={14} />
                              <span>Giao hàng thành công (Đã thu COD)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order, "cancelled")}
                              disabled={updatingId === order._id}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 px-3.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50"
                            >
                              <FiXCircle size={13} />
                              <span>Giao thất bại / Khách trả hàng</span>
                            </button>
                          </>
                        ) : isDelivered ? (
                          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs font-bold text-emerald-400">
                            <FiCheckCircle />
                            <span>Giao hàng &amp; Thu COD thành công</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-400">
                            <FiXCircle />
                            <span>Đã hủy đơn hàng</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
            <FiPackage className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-3 text-base font-bold text-white">Không tìm thấy đơn hàng nào</h3>
            <p className="mt-1 text-xs text-slate-400">
              Hãy thử thay đổi tiêu chí lọc hoặc tìm kiếm theo thông tin khác.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageOrders;
